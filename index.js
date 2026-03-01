import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import serve from 'koa-static';
import path from 'path';
import { fileURLToPath } from 'url';
import router from './routes.js';
import { initDatabase } from './db.js';
import koaBody from 'koa-body';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = new Koa();

// 中间件
app.use(koaBody({
  multipart: true,
  formidable: {
    uploadDir: path.join(__dirname, 'images'),
    keepExtensions: true
  }
}));

// 静态文件服务
app.use(serve(path.join(__dirname, 'dist')));
app.use(serve(path.join(__dirname, 'images')));

// API路由
app.use(router.routes());
app.use(router.allowedMethods());

// 启动服务器
const PORT = 3002;

app.listen(PORT, async () => {
  try {
    // 初始化数据库
    await initDatabase();
    console.log(`服务器运行在 http://localhost:${PORT}`);
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
});

export default app;