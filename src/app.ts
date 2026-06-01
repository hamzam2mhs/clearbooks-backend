import express from 'express';
import cors from 'cors';
import prisma from './config/prisma';
import { authenticate } from './middleware/auth.middleware';
import { ensureProvisioned } from './middleware/provision.middleware';
import transactionRoutes from './routes/transaction.routes';
import openingSnapshotRoutes from './routes/openingSnapshot.routes';
import summaryRoutes from './routes/summary.routes'
import periodsRoutes from './routes/periods.routes';
import migrationRoutes from './routes/migration.routes';

const app = express();

app.use(
    cors({
        origin: 'http://localhost:5173',
        credentials: true,
    })
);

app.use(express.json());

// Health
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

// DB health
app.get('/health/db', async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ db: 'connected' });
});

/**
 * Protected routes
 * Every route below:
 *  - Verifies JWT
 *  - Ensures user + business exist
 */

// Opening Snapshot
app.use(
    '/api/opening-snapshot',
    authenticate,
    ensureProvisioned,
    openingSnapshotRoutes
);

// Transactions
app.use(
    '/api/transactions',
    authenticate,
    ensureProvisioned,
    transactionRoutes
);

// Summary
app.use(
    '/api/summary',
    authenticate,
    ensureProvisioned,
    summaryRoutes
);

//periods
app.use(
    '/api/periods',
    authenticate,
    ensureProvisioned,
    periodsRoutes
);

// Migration
app.use(
    '/api/migration',
    authenticate,
    ensureProvisioned,
    migrationRoutes
);

// Identity test
app.get(
    '/api/me',
    authenticate,
    ensureProvisioned,
    (req, res) => {
        res.json({
            cognitoSub: req.user?.cognitoSub,
            email: req.user?.email,
            userId: req.context?.userId,
            businessId: req.context?.businessId,
        });
    }
);

export default app;
