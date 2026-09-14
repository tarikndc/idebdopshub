import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import router from './server/routes.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsing middleware with larger limit to support ticket document uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Request logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Mount API Endpoints FIRST
  app.use('/api', router);

  // Healthcheck endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', date: new Date().toISOString() });
  });

  // Serve uploaded files statically from physical uploads folder in the project root
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Serve static UI assets or integrate Vite development middleware
  const isProd = process.env.NODE_ENV === 'production';
  
  if (!isProd) {
    console.log('Running in Development mode. Injecting Vite middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Running in Production mode. Serving static files from "./dist"...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`iDE Insights Portal running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to initialize server:', error);
  process.exit(1);
});
