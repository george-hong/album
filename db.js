import mysql from 'mysql2/promise';

// 创建数据库连接池
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'album',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 初始化数据库
export const initDatabase = async () => {
  try {
    // 测试数据库连接
    const connection = await pool.getConnection();
    connection.release();
    console.log('数据库连接成功');
  } catch (error) {
    console.error('数据库连接失败:', error);
    throw error;
  }
};

// 获取数据库连接
export const getConnection = async () => {
  return await pool.getConnection();
};

// 关闭数据库连接
export const closeDatabase = async () => {
  await pool.end();
  console.log('数据库连接已关闭');
};

export default pool;