import express from 'express';
import prisma from './config/prisma';

const app = express();

app.use(express.json());

// App health
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// DB health (temporary, dev-only)
app.get('/health/db', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ db: 'connected' });
  } catch (err) {
    res.status(500).json({ db: 'error', error: String(err) });
  }
});

export default app;

