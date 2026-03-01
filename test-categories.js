import pool from './db.js';

async function getCategories() {
  try {
    const [categories] = await pool.execute('SELECT * FROM categories');
    console.log('数据库中的分类:', categories);
    await pool.end();
  } catch (error) {
    console.error('获取分类失败:', error);
    await pool.end();
  }
}

getCategories();