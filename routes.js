import Router from '@koa/router';
import pool from './db.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = new Router();

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
        return {
          id: photo.id.toString(),
          filename: photo.filename,
          categories: categories.map(category => ({
            id: category.id.toString(),
            name: category.name
          })),
          path: photo.path,
          user_id: photo.user_id.toString()
        };
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

        const filename = photo_name || file.name;
        const [result] = await connection.execute(
          'INSERT INTO photos (filename, path, user_id) VALUES (?, ?, ?)',
          [filename, randomName, parseInt(user_id, 10)]
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
      'SELECT id, path, user_id FROM photos WHERE id = ? AND status = 1',
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

    ctx.body = {
      id: id.toString(),
      filename,
      categories: categories.map(category => ({
        id: category.id.toString(),
        name: category.name
      })),
      path: photoRows[0].path,
      user_id: photoRows[0].user_id.toString()
    };
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
