import express from 'express';
import prisma from './config/prisma';
import { authenticate } from './middleware/auth.middleware';
import { ensureProvisioned } from './middleware/provision.middleware';

const app = express();

app.use(express.json());

// App health
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// DB health (temporary, dev-only)
app.get('/health/db', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ db: 'connected' });
});

/**
 * 🔐 Auth + 🧠 Auto-provision
 */
app.use('/api', authenticate, ensureProvisioned);

// Test protected + provisioned endpoint
app.get('/api/me', (req, res) => {
  res.json({
    cognitoSub: req.user?.cognitoSub,
    email: req.user?.email,
    userId: req.userDb?.id,
    businessId: req.userDb?.business?.id,
  });
});

export default app;
