import { Router } from 'express';
import prisma from '../config/prisma';
import { ensureMonthlyPeriod } from '../utils/period.service';

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

function isPositiveInteger(value: unknown) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

function isNonNegativeInteger(value: unknown) {
  return Number.isInteger(Number(value)) && Number(value) >= 0;
}

function getEndOfToday() {
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  return endOfToday;
}

type TransactionDateValidationResult =
    | {
  valid: true;
}
    | {
  valid: false;
  status: number;
  body: {
    error: string;
    message: string;
  };
};

async function validateTransactionDate(
    businessId: string,
    occurredDate: Date
): Promise<TransactionDateValidationResult> {
  if (Number.isNaN(occurredDate.getTime())) {
    return {
      valid: false,
      status: 400,
      body: {
        error: 'INVALID_DATE',
        message: 'Transaction date is invalid',
      },
    };
  }

  if (occurredDate > getEndOfToday()) {
    return {
      valid: false,
      status: 400,
      body: {
        error: 'FUTURE_TRANSACTION_NOT_ALLOWED',
        message: 'Transaction date cannot be in the future',
      },
    };
  }

  const openingSnapshot = await prisma.openingSnapshot.findUnique({
    where: { businessId },
  });

  if (openingSnapshot && occurredDate < openingSnapshot.effectiveDate) {
    return {
      valid: false,
      status: 400,
      body: {
        error: 'BEFORE_OPENING_SNAPSHOT',
        message: 'Transaction date cannot be before the opening snapshot date',
      },
    };
  }

  return {
    valid: true,
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

    if (amountCents == null || !category || !occurredAt) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'amountCents, category, and occurredAt are required',
      });
    }

    if (!isPositiveInteger(amountCents)) {
      return res.status(400).json({
        error: 'INVALID_AMOUNT',
        message: 'amountCents must be a positive integer',
      });
    }

    if (!isNonNegativeInteger(taxCents)) {
      return res.status(400).json({
        error: 'INVALID_TAX_AMOUNT',
        message: 'taxCents must be a non-negative integer',
      });
    }

    const occurredDate = new Date(occurredAt);

    const dateValidation = await validateTransactionDate(
        businessId,
        occurredDate
    );

    if (!dateValidation.valid) {
      return res.status(dateValidation.status).json(dateValidation.body);
    }

    const period = await ensureMonthlyPeriod(businessId, occurredDate);

    if (period.locked) {
      return res.status(400).json({
        error: 'PERIOD_LOCKED',
        message: 'Cannot add transaction to locked reporting period',
      });
    }

    const transaction = await prisma.transaction.create({
      data: {
        businessId,
        type: 'INCOME',
        amountCents: BigInt(amountCents),
        taxCents: BigInt(taxCents),
        category,
        occurredAt: occurredDate,
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

    if (amountCents == null || !category || !occurredAt) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'amountCents, category, and occurredAt are required',
      });
    }

    if (!isPositiveInteger(amountCents)) {
      return res.status(400).json({
        error: 'INVALID_AMOUNT',
        message: 'amountCents must be a positive integer',
      });
    }

    if (!isNonNegativeInteger(taxCents)) {
      return res.status(400).json({
        error: 'INVALID_TAX_AMOUNT',
        message: 'taxCents must be a non-negative integer',
      });
    }

    const occurredDate = new Date(occurredAt);

    const dateValidation = await validateTransactionDate(
        businessId,
        occurredDate
    );

    if (!dateValidation.valid) {
      return res.status(dateValidation.status).json(dateValidation.body);
    }

    const period = await ensureMonthlyPeriod(businessId, occurredDate);

    if (period.locked) {
      return res.status(400).json({
        error: 'PERIOD_LOCKED',
        message: 'Cannot add transaction to locked reporting period',
      });
    }

    const transaction = await prisma.transaction.create({
      data: {
        businessId,
        type: 'EXPENSE',
        amountCents: BigInt(amountCents),
        taxCents: BigInt(taxCents),
        category,
        occurredAt: occurredDate,
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
 * List transactions optionally filtered by date
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