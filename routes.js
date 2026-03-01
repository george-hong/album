import Router from '@koa/router';
import pool from './db.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = new Router();

// 获取所有分类
router.get('/api/categories', async (ctx) => {
  try {
    const [categories] = await pool.execute('SELECT * FROM categories');
    ctx.body = categories.map(cat => ({
      id: cat.id.toString(),
      name: cat.name
    }));
  } catch (error) {
    console.error('获取分类失败:', error);
    ctx.status = 500;
    ctx.body = { error: '获取分类失败' };
  }
});

// 添加分类
router.post('/api/categories', async (ctx) => {
  try {
    const { name } = ctx.request.body;
    const [result] = await pool.execute('INSERT INTO categories (name) VALUES (?)', [name]);
    ctx.body = {
      id: result.insertId.toString(),
      name
    };
  } catch (error) {
    console.error('添加分类失败:', error);
    ctx.status = 500;
    ctx.body = { error: '添加分类失败' };
  }
});

// 删除分类
router.delete('/api/categories/:id', async (ctx) => {
  try {
    const { id } = ctx.params;
    
    // 开始事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 删除分类关联
      await connection.execute('DELETE FROM photo_categories WHERE category_id = ?', [parseInt(id)]);
      // 删除分类
      await connection.execute('DELETE FROM categories WHERE id = ?', [parseInt(id)]);
      
      // 提交事务
      await connection.commit();
      connection.release();
      
      ctx.body = { success: true };
    } catch (error) {
      // 回滚事务
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('删除分类失败:', error);
    ctx.status = 500;
    ctx.body = { error: '删除分类失败' };
  }
});

// 获取用户的图片
router.get('/api/photos/:userId', async (ctx) => {
  try {
    const { userId } = ctx.params;
    
    // 获取用户的图片（只获取状态为1的图片）
    const [photos] = await pool.execute('SELECT * FROM photos WHERE user_id = ? AND status = 1', [parseInt(userId)]);
    
    // 为每个图片获取分类
    const photosWithCategories = await Promise.all(
      photos.map(async (photo) => {
        const [categories] = await pool.execute(
          'SELECT category_id FROM photo_categories WHERE photo_id = ?',
          [photo.id]
        );
        return {
          id: photo.id.toString(),
          filename: photo.filename,
          categories: categories.map(c => c.category_id.toString()),
          path: photo.path,
          user_id: photo.user_id.toString()
        };
      })
    );
    
    ctx.body = photosWithCategories;
  } catch (error) {
    console.error('获取图片失败:', error);
    ctx.status = 500;
    ctx.body = { error: '获取图片失败' };
  }
});

// 添加图片
router.post('/api/photos', async (ctx) => {
  try {
    const { user_id, categories, photo_name } = ctx.request.body;
    const files = ctx.request.files;
    
    // 确保categories是数组
    const categoryArray = Array.isArray(categories) ? categories : [categories];
    
    if (!files || !files.file) {
      ctx.status = 400;
      ctx.body = { error: '请选择文件' };
      return;
    }
    
    // 调试信息
    console.log('接收到的分类ID:', categoryArray);
    
    // 处理多个文件上传
    const uploadedFiles = Array.isArray(files.file) ? files.file : [files.file];
    const results = [];
    
    // 开始事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      for (const file of uploadedFiles) {
        // 生成随机文件名
        const randomName = Math.random().toString(36).substring(2, 15) + path.extname(file.name);
        
        // 确保images目录存在
        const imagesDir = path.join(__dirname, 'images');
        if (!fs.existsSync(imagesDir)) {
          fs.mkdirSync(imagesDir, { recursive: true });
        }
        
        // 重命名文件到images目录
        const newFilePath = path.join(imagesDir, randomName);
        fs.renameSync(file.path, newFilePath);
        
        // 确定文件名
        const filename = photo_name || file.name;
        
        // 插入图片
        const [result] = await connection.execute(
          'INSERT INTO photos (filename, path, user_id) VALUES (?, ?, ?)',
          [filename, randomName, parseInt(user_id)]
        );
        
        const photoId = result.insertId;
        
        // 插入图片-分类关联
        for (const categoryId of categoryArray) {
          try {
            // 检查分类是否存在
            const [categoryCheck] = await connection.execute(
              'SELECT id FROM categories WHERE id = ?',
              [parseInt(categoryId)]
            );
            
            if (categoryCheck.length > 0) {
              await connection.execute(
                'INSERT INTO photo_categories (photo_id, category_id) VALUES (?, ?)',
                [photoId, parseInt(categoryId)]
              );
            } else {
              console.log(`分类ID ${categoryId} 不存在，跳过`);
            }
          } catch (error) {
            console.error(`插入分类关联失败，分类ID: ${categoryId}`, error);
            // 继续处理其他分类，不中断整个上传过程
          }
        }
        
        results.push({
          id: photoId.toString(),
          filename: filename,
          categories: categoryArray,
          path: randomName,
          user_id
        });
      }
      
      // 提交事务
      await connection.commit();
      connection.release();
      
      ctx.body = results;
    } catch (error) {
      // 回滚事务
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('添加图片失败:', error);
    ctx.status = 500;
    ctx.body = { error: '添加图片失败' };
  }
});

// 删除图片
router.delete('/api/photos/:id', async (ctx) => {
  try {
    const { id } = ctx.params;
    
    // 逻辑删除：更新status为0
    const [result] = await pool.execute(
      'UPDATE photos SET status = 0 WHERE id = ?',
      [parseInt(id)]
    );
    
    if (result.affectedRows === 0) {
      ctx.status = 404;
      ctx.body = { error: '图片不存在' };
      return;
    }
    
    ctx.body = { success: true };
  } catch (error) {
    console.error('删除图片失败:', error);
    ctx.status = 500;
    ctx.body = { error: '删除图片失败' };
  }
});

// 验证用户
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
      ctx.body = { error: '用户名或密码错误' };
    }
  } catch (error) {
    console.error('验证用户失败:', error);
    ctx.status = 500;
    ctx.body = { error: '验证用户失败' };
  }
});

// 注册用户
router.post('/api/auth/register', async (ctx) => {
  try {
    const { username, password } = ctx.request.body;
    
    // 检查用户名是否已存在
    const [existingUsers] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    if (existingUsers.length > 0) {
      ctx.status = 400;
      ctx.body = { error: '用户名已存在' };
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
    console.error('注册用户失败:', error);
    ctx.status = 500;
    ctx.body = { error: '注册用户失败' };
  }
});

export default router;