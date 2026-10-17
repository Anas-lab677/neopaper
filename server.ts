import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();

  // Security hardening: hide server framework
  app.disable('x-powered-by');

  // Security headers middleware
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Parse JSON bodies with a safe 2mb limit
  app.use(express.json({ limit: '2mb' }));

  // Root health check endpoint for Cloud Run and load balancers
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'healthy', uptime: Math.round(process.uptime()) });
  });

  // Mount API routes
  app.use('/api', apiRouter);

  if (isProduction) {
    // Serve built static files with long-lived caching for immutable assets
    const distPath = path.resolve(__dirname, 'dist');
    const assetsPath = path.join(distPath, 'assets');

    app.use('/assets', express.static(assetsPath, { maxAge: '1y', immutable: true }));
    app.use(express.static(distPath, { maxAge: '1h' }));

    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Create Vite dev server in middleware mode for HMR
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  🌅 Daybreak server running at:\n`);
    console.log(`     ➜  Host:    http://0.0.0.0:${PORT}\n`);
    console.log(`     ➜  Mode:    ${isProduction ? 'Production' : 'Development'}\n`);
  });

  // Graceful shutdown handling
  const shutdown = (signal: string) => {
    console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('[Server] Connections closed. Exiting.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
