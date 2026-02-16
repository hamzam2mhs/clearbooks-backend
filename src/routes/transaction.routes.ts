import { Router } from 'express';
import prisma from '../config/prisma';

const router = Router();

/**
 * Utility: safely convert BigInt fields to string
 */
function serializeTransaction(tx: any) {
  return {
    ...tx,
    amountCents: tx.amountCents.toString(),
    taxCents: tx.taxCents.toString(),
  };
}

/**
 * Utility: build date filter
 */
function buildDateFilter(from?: string, to?: string) {
  if (!from && !to) return undefined;

  return {
    gte: from ? new Date(from) : undefined,
    lte: to ? new Date(to) : undefined,
  };
}

/**
 * --------------------------------------------------------
 * POST /api/transactions/income
 * --------------------------------------------------------
 */
router.post('/income', async (req, res) => {
  try {
    const businessId = req.context?.businessId;
    if (!businessId) {
      return res.status(401).json({ error: 'UNAUTHORIZED' });
    }

    const { amountCents, taxCents = 0, category, occurredAt } = req.body;

    if (!amountCents || !category || !occurredAt) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'amountCents, category, and occurredAt are required',
      });
    }

    const transaction = await prisma.transaction.create({
      data: {
        businessId,
        type: 'INCOME',
        amountCents: BigInt(amountCents),
        taxCents: BigInt(taxCents),
        category,
        occurredAt: new Date(occurredAt),
        source: 'MANUAL',
        confirmed: true,
      },
    });

    return res.status(201).json(serializeTransaction(transaction));

  } catch (err) {
    console.error('Create income failed:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});


/**
 * --------------------------------------------------------
 * POST /api/transactions/expense
 * --------------------------------------------------------
 */
router.post('/expense', async (req, res) => {
  try {
    const businessId = req.context?.businessId;
    if (!businessId) {
      return res.status(401).json({ error: 'UNAUTHORIZED' });
    }

    const { amountCents, taxCents = 0, category, occurredAt } = req.body;

    if (!amountCents || !category || !occurredAt) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'amountCents, category, and occurredAt are required',
      });
    }

    const transaction = await prisma.transaction.create({
      data: {
        businessId,
        type: 'EXPENSE',
        amountCents: BigInt(amountCents),
        taxCents: BigInt(taxCents),
        category,
        occurredAt: new Date(occurredAt),
        source: 'MANUAL',
        confirmed: true,
      },
    });

    return res.status(201).json(serializeTransaction(transaction));

  } catch (err) {
    console.error('Create expense failed:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});


/**
 * --------------------------------------------------------
 * GET /api/transactions
 * List transactions (optionally filtered by date)
 * --------------------------------------------------------
 */
router.get('/', async (req, res) => {
  try {
    const businessId = req.context?.businessId;
    if (!businessId) {
      return res.status(401).json({ error: 'UNAUTHORIZED' });
    }

    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    const dateFilter = buildDateFilter(from, to);

    const transactions = await prisma.transaction.findMany({
      where: {
        businessId,
        occurredAt: dateFilter,
      },
      orderBy: {
        occurredAt: 'desc',
      },
    });

    return res.json(transactions.map(serializeTransaction));

  } catch (err) {
    console.error('List transactions failed:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

export default router;
