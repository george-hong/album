import app from './index.js';

const PORT = 3000;

app.listen(PORT, async () => {
  try {
    console.log(`服务器运行在 http://localhost:${PORT}`);
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
});