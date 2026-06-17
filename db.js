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
  let connection;
  try {
    // 测试数据库连接
    connection = await pool.getConnection();
    const ensureColumn = async (columnName, definition) => {
      const [columns] = await connection.execute(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'photos'
         AND COLUMN_NAME = ?`,
        [columnName]
      );

      if (columns.length === 0) {
        await connection.execute(`ALTER TABLE photos ADD COLUMN ${definition}`);
      }
    };

    await ensureColumn('width', 'width INT DEFAULT NULL AFTER path');
    await ensureColumn('height', 'height INT DEFAULT NULL AFTER width');
    console.log('数据库连接成功');
  } catch (error) {
    console.error('数据库连接失败:', error);
    throw error;
  } finally {
    connection?.release();
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
