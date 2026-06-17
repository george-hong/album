import Router from '@koa/router';
import pool from './db.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = new Router();

const getImageDimensions = (filePath) => {
  const buffer = fs.readFileSync(filePath);

  if (buffer.length >= 24 && buffer.toString('ascii', 1, 4) === 'PNG') {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20)
    };
  }

  if (buffer.length >= 10 && buffer.toString('ascii', 0, 3) === 'GIF') {
    return {
      width: buffer.readUInt16LE(6),
      height: buffer.readUInt16LE(8)
    };
  }

  if (buffer.length >= 26 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    const type = buffer.toString('ascii', 12, 16);
    if (type === 'VP8 ' && buffer.length >= 30) {
      return {
        width: buffer.readUInt16LE(26) & 0x3fff,
        height: buffer.readUInt16LE(28) & 0x3fff
      };
    }
    if (type === 'VP8L' && buffer.length >= 25) {
      const bits = buffer.readUInt32LE(21);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1
      };
    }
    if (type === 'VP8X' && buffer.length >= 30) {
      return {
        width: buffer.readUIntLE(24, 3) + 1,
        height: buffer.readUIntLE(27, 3) + 1
      };
    }
  }

  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 3 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }

      const marker = buffer[offset + 1];
      const blockLength = buffer.readUInt16BE(offset + 2);
      if (blockLength < 2 || offset + 2 + blockLength > buffer.length) {
        break;
      }
      if (
        marker >= 0xc0
        && marker <= 0xcf
        && ![0xc4, 0xc8, 0xcc].includes(marker)
        && blockLength >= 7
      ) {
        return {
          width: buffer.readUInt16BE(offset + 7),
          height: buffer.readUInt16BE(offset + 5)
        };
      }

      offset += 2 + blockLength;
    }
  }

  return { width: null, height: null };
};

const normalizeDimension = (value) => (
  Number.isFinite(value) && value > 0 ? value : null
);

const serializePhoto = (photo, categories = []) => ({
  id: photo.id.toString(),
  filename: photo.filename,
  categories,
  path: photo.path,
  width: normalizeDimension(photo.width),
  height: normalizeDimension(photo.height),
  user_id: photo.user_id.toString()
});

router.get('/api/categories', async (ctx) => {
  try {
    const [categories] = await pool.execute('SELECT * FROM categories');
    ctx.body = categories.map(cat => ({
      id: cat.id.toString(),
      name: cat.name
    }));
  } catch (error) {
    console.error('Failed to load categories:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to load categories' };
  }
});

router.post('/api/categories', async (ctx) => {
  try {
    const { name } = ctx.request.body;
    const [result] = await pool.execute(
      'INSERT INTO categories (name) VALUES (?)',
      [name]
    );
    ctx.body = {
      id: result.insertId.toString(),
      name
    };
  } catch (error) {
    console.error('Failed to add category:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to add category' };
  }
});

router.delete('/api/categories/:id', async (ctx) => {
  try {
    const { id } = ctx.params;
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      await connection.execute('DELETE FROM photo_categories WHERE category_id = ?', [parseInt(id, 10)]);
      await connection.execute('DELETE FROM categories WHERE id = ?', [parseInt(id, 10)]);
      await connection.commit();
      connection.release();
      ctx.body = { success: true };
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Failed to delete category:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to delete category' };
  }
});

router.put('/api/categories/:id', async (ctx) => {
  try {
    const { id } = ctx.params;
    const { name } = ctx.request.body;

    await pool.execute(
      'UPDATE categories SET name = ? WHERE id = ?',
      [name, parseInt(id, 10)]
    );

    ctx.body = {
      success: true,
      id: id.toString(),
      name
    };
  } catch (error) {
    console.error('Failed to update category:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to update category' };
  }
});

router.get('/api/photos/:userId', async (ctx) => {
  try {
    const { userId } = ctx.params;
    const page = Math.max(parseInt(ctx.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(ctx.query.limit || '24', 10), 1), 60);
    const offset = (page - 1) * limit;
    const search = (ctx.query.search || '').trim();
    const filterMode = ctx.query.filterMode === 'OR' ? 'OR' : 'AND';
    const categoryIds = (ctx.query.categories || '')
      .split(',')
      .map(id => parseInt(id, 10))
      .filter(Number.isFinite);

    const params = [parseInt(userId, 10)];
    const whereParts = ['p.user_id = ?', 'p.status = 1'];

    if (search) {
      whereParts.push('p.filename LIKE ?');
      params.push(`%${search}%`);
    }

    if (categoryIds.length > 0) {
      if (filterMode === 'AND') {
        whereParts.push(`p.id IN (
          SELECT photo_id
          FROM photo_categories
          WHERE category_id IN (${categoryIds.map(() => '?').join(',')})
          GROUP BY photo_id
          HAVING COUNT(DISTINCT category_id) = ?
        )`);
        params.push(...categoryIds, categoryIds.length);
      } else {
        whereParts.push(`EXISTS (
          SELECT 1
          FROM photo_categories pc_filter
          WHERE pc_filter.photo_id = p.id
          AND pc_filter.category_id IN (${categoryIds.map(() => '?').join(',')})
        )`);
        params.push(...categoryIds);
      }
    }

    const whereSql = whereParts.join(' AND ');
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM photos p WHERE ${whereSql}`,
      params
    );

    const [photos] = await pool.execute(
      `SELECT p.*
       FROM photos p
       WHERE ${whereSql}
       ORDER BY p.id DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    const photosWithCategories = await Promise.all(
      photos.map(async (photo) => {
        const [categories] = await pool.execute(
          `SELECT c.id, c.name
           FROM photo_categories pc
           INNER JOIN categories c ON c.id = pc.category_id
           WHERE pc.photo_id = ?
           ORDER BY c.id`,
          [photo.id]
        );
        return serializePhoto(photo, categories.map(category => ({
            id: category.id.toString(),
            name: category.name
          })));
      })
    );

    const total = countRows[0]?.total || 0;
    ctx.body = {
      items: photosWithCategories,
      page,
      limit,
      total,
      hasMore: offset + photosWithCategories.length < total
    };
  } catch (error) {
    console.error('Failed to load photos:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to load photos' };
  }
});

router.post('/api/photos', async (ctx) => {
  try {
    const { user_id, categories, photo_name } = ctx.request.body;
    const files = ctx.request.files;
    const categoryArray = Array.isArray(categories) ? categories : [categories].filter(Boolean);

    if (!files || !files.file) {
      ctx.status = 400;
      ctx.body = { error: 'Please choose at least one file' };
      return;
    }

    const uploadedFiles = Array.isArray(files.file) ? files.file : [files.file];
    const results = [];
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      for (const file of uploadedFiles) {
        const randomName = Math.random().toString(36).substring(2, 15) + path.extname(file.name);
        const imagesDir = path.join(__dirname, 'images');
        if (!fs.existsSync(imagesDir)) {
          fs.mkdirSync(imagesDir, { recursive: true });
        }

        const newFilePath = path.join(imagesDir, randomName);
        fs.renameSync(file.path, newFilePath);
        const dimensions = getImageDimensions(newFilePath);

        const filename = photo_name || file.name;
        const [result] = await connection.execute(
          'INSERT INTO photos (filename, path, width, height, user_id) VALUES (?, ?, ?, ?, ?)',
          [filename, randomName, dimensions.width, dimensions.height, parseInt(user_id, 10)]
        );

        const photoId = result.insertId;

        for (const categoryId of categoryArray) {
          const [categoryCheck] = await connection.execute(
            'SELECT id FROM categories WHERE id = ?',
            [parseInt(categoryId, 10)]
          );

          if (categoryCheck.length > 0) {
            await connection.execute(
              'INSERT INTO photo_categories (photo_id, category_id) VALUES (?, ?)',
              [photoId, parseInt(categoryId, 10)]
            );
          }
        }

        results.push({
          id: photoId.toString(),
          filename,
          categories: categoryArray,
          path: randomName,
          width: dimensions.width,
          height: dimensions.height,
          user_id
        });
      }

      await connection.commit();
      connection.release();
      ctx.body = results;
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Failed to add photos:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to add photos' };
  }
});

router.post('/api/photos/dimensions/sync', async (ctx) => {
  try {
    const userId = parseInt(ctx.request.body.user_id, 10);
    const force = ctx.request.body.force === true;
    const params = [];
    const whereParts = ['status = 1'];

    if (Number.isFinite(userId)) {
      whereParts.push('user_id = ?');
      params.push(userId);
    }

    if (!force) {
      whereParts.push('(width IS NULL OR height IS NULL OR width <= 0 OR height <= 0)');
    }

    const [photos] = await pool.execute(
      `SELECT id, path FROM photos WHERE ${whereParts.join(' AND ')}`,
      params
    );

    let updated = 0;
    let skipped = 0;
    const failed = [];

    for (const photo of photos) {
      const imagePath = path.join(__dirname, 'images', photo.path);
      if (!fs.existsSync(imagePath)) {
        skipped += 1;
        failed.push({
          id: photo.id.toString(),
          reason: 'File not found'
        });
        continue;
      }

      const dimensions = getImageDimensions(imagePath);
      if (!dimensions.width || !dimensions.height) {
        skipped += 1;
        failed.push({
          id: photo.id.toString(),
          reason: 'Unsupported image dimensions'
        });
        continue;
      }

      await pool.execute(
        'UPDATE photos SET width = ?, height = ? WHERE id = ?',
        [dimensions.width, dimensions.height, photo.id]
      );
      updated += 1;
    }

    ctx.body = {
      success: true,
      scanned: photos.length,
      updated,
      skipped,
      failed
    };
  } catch (error) {
    console.error('Failed to sync photo dimensions:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to sync photo dimensions' };
  }
});

router.put('/api/photos/batch', async (ctx) => {
  const connection = await pool.getConnection();

  try {
    const photoIds = Array.isArray(ctx.request.body.photoIds)
      ? ctx.request.body.photoIds
        .map(photoId => parseInt(photoId, 10))
        .filter(Number.isFinite)
      : [];
    const uniquePhotoIds = [...new Set(photoIds)];
    const categoryIds = Array.isArray(ctx.request.body.categories)
      ? ctx.request.body.categories
        .map(categoryId => parseInt(categoryId, 10))
        .filter(Number.isFinite)
      : [];
    const uniqueCategoryIds = [...new Set(categoryIds)];

    if (uniquePhotoIds.length === 0) {
      ctx.status = 400;
      ctx.body = { error: 'Please choose at least one photo' };
      return;
    }

    await connection.beginTransaction();

    const placeholders = uniquePhotoIds.map(() => '?').join(',');
    const [photoRows] = await connection.execute(
      `SELECT id, filename, path, width, height, user_id FROM photos WHERE id IN (${placeholders}) AND status = 1`,
      uniquePhotoIds
    );

    if (photoRows.length !== uniquePhotoIds.length) {
      await connection.rollback();
      ctx.status = 404;
      ctx.body = { error: 'Some photos were not found' };
      return;
    }

    await connection.execute(
      `DELETE FROM photo_categories WHERE photo_id IN (${placeholders})`,
      uniquePhotoIds
    );

    for (const categoryId of uniqueCategoryIds) {
      const [categoryCheck] = await connection.execute(
        'SELECT id FROM categories WHERE id = ?',
        [categoryId]
      );

      if (categoryCheck.length > 0) {
        for (const photoId of uniquePhotoIds) {
          await connection.execute(
            'INSERT INTO photo_categories (photo_id, category_id) VALUES (?, ?)',
            [photoId, categoryId]
          );
        }
      }
    }

    const [categoryRows] = await connection.execute(
      `SELECT pc.photo_id, c.id, c.name
       FROM photo_categories pc
       INNER JOIN categories c ON c.id = pc.category_id
       WHERE pc.photo_id IN (${placeholders})
       ORDER BY pc.photo_id, c.id`,
      uniquePhotoIds
    );

    await connection.commit();

    const categoriesByPhotoId = categoryRows.reduce((result, category) => {
      const photoId = category.photo_id.toString();
      result[photoId] = result[photoId] || [];
      result[photoId].push({
        id: category.id.toString(),
        name: category.name
      });
      return result;
    }, {});

    ctx.body = photoRows.map(photo => serializePhoto(
      photo,
      categoriesByPhotoId[photo.id.toString()] || []
    ));
  } catch (error) {
    await connection.rollback();
    console.error('Failed to batch update photos:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to batch update photos' };
  } finally {
    connection.release();
  }
});

router.put('/api/photos/:id', async (ctx) => {
  const connection = await pool.getConnection();

  try {
    const { id } = ctx.params;
    const photoId = parseInt(id, 10);
    const filename = String(ctx.request.body.filename || '').trim();
    const categoryIds = Array.isArray(ctx.request.body.categories)
      ? ctx.request.body.categories
        .map(categoryId => parseInt(categoryId, 10))
        .filter(Number.isFinite)
      : [];
    const uniqueCategoryIds = [...new Set(categoryIds)];

    if (!Number.isFinite(photoId)) {
      ctx.status = 400;
      ctx.body = { error: 'Invalid photo id' };
      return;
    }

    if (!filename) {
      ctx.status = 400;
      ctx.body = { error: 'Filename is required' };
      return;
    }

    await connection.beginTransaction();

    const [photoRows] = await connection.execute(
      'SELECT id, path, width, height, user_id FROM photos WHERE id = ? AND status = 1',
      [photoId]
    );

    if (photoRows.length === 0) {
      await connection.rollback();
      ctx.status = 404;
      ctx.body = { error: 'Photo not found' };
      return;
    }

    await connection.execute(
      'UPDATE photos SET filename = ? WHERE id = ?',
      [filename, photoId]
    );

    await connection.execute(
      'DELETE FROM photo_categories WHERE photo_id = ?',
      [photoId]
    );

    for (const categoryId of uniqueCategoryIds) {
      const [categoryCheck] = await connection.execute(
        'SELECT id FROM categories WHERE id = ?',
        [categoryId]
      );

      if (categoryCheck.length > 0) {
        await connection.execute(
          'INSERT INTO photo_categories (photo_id, category_id) VALUES (?, ?)',
          [photoId, categoryId]
        );
      }
    }

    const [categories] = await connection.execute(
      `SELECT c.id, c.name
       FROM photo_categories pc
       INNER JOIN categories c ON c.id = pc.category_id
       WHERE pc.photo_id = ?
       ORDER BY c.id`,
      [photoId]
    );

    await connection.commit();

    ctx.body = serializePhoto({
      ...photoRows[0],
      filename
    }, categories.map(category => ({
        id: category.id.toString(),
        name: category.name
      })));
  } catch (error) {
    await connection.rollback();
    console.error('Failed to update photo:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to update photo' };
  } finally {
    connection.release();
  }
});

router.delete('/api/photos/:id', async (ctx) => {
  try {
    const { id } = ctx.params;
    const [result] = await pool.execute(
      'UPDATE photos SET status = 0 WHERE id = ?',
      [parseInt(id, 10)]
    );

    if (result.affectedRows === 0) {
      ctx.status = 404;
      ctx.body = { error: 'Photo not found' };
      return;
    }

    ctx.body = { success: true };
  } catch (error) {
    console.error('Failed to delete photo:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to delete photo' };
  }
});

router.post('/api/auth/login', async (ctx) => {
  try {
    const { username, password } = ctx.request.body;
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password]
    );

    if (users.length > 0) {
      const user = users[0];
      ctx.body = {
        id: user.id.toString(),
        username: user.username
      };
    } else {
      ctx.status = 401;
      ctx.body = { error: 'Invalid username or password' };
    }
  } catch (error) {
    console.error('Failed to validate user:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to validate user' };
  }
});

router.post('/api/auth/register', async (ctx) => {
  try {
    const { username, password } = ctx.request.body;
    const [existingUsers] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      ctx.status = 400;
      ctx.body = { error: 'Username already exists' };
      return;
    }

    const [result] = await pool.execute(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, password]
    );

    ctx.body = {
      id: result.insertId.toString(),
      username
    };
  } catch (error) {
    console.error('Failed to register user:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to register user' };
  }
});

export default router;
