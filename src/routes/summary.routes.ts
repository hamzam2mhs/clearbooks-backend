import { Router } from 'express';
import prisma from '../config/prisma';

const router = Router();

/**
 * Helper: build date filter safely
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
 * GET /api/summary/income
 * Returns:
 *  - total income
 *  - total tax collected
 * --------------------------------------------------------
 */
router.get('/income', async (req, res) => {
    try {
        const businessId = req.context?.businessId;
        if (!businessId) {
            return res.status(401).json({ error: 'UNAUTHORIZED' });
        }

        const from = req.query.from as string | undefined;
        const to = req.query.to as string | undefined;

        const dateFilter = buildDateFilter(from, to);

        const result = await prisma.transaction.aggregate({
            where: {
                businessId,
                type: 'INCOME',
                occurredAt: dateFilter,
            },
            _sum: {
                amountCents: true,
                taxCents: true,
            },
        });

        return res.json({
            totalIncomeCents: result._sum.amountCents?.toString() ?? '0',
            totalTaxCollectedCents: result._sum.taxCents?.toString() ?? '0',
        });

    } catch (err) {
        console.error('Income summary failed:', err);
        return res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
});


/**
 * --------------------------------------------------------
 * GET /api/summary/tax
 * Returns:
 *  - tax collected (income)
 *  - tax paid (expenses)
 *  - net tax payable
 * --------------------------------------------------------
 */
router.get('/tax', async (req, res) => {
    try {
        const businessId = req.context?.businessId;
        if (!businessId) {
            return res.status(401).json({ error: 'UNAUTHORIZED' });
        }

        const from = req.query.from as string | undefined;
        const to = req.query.to as string | undefined;

        const dateFilter = buildDateFilter(from, to);

        // Tax collected from income
        const incomeTax = await prisma.transaction.aggregate({
            where: {
                businessId,
                type: 'INCOME',
                occurredAt: dateFilter,
            },
            _sum: {
                taxCents: true,
            },
        });

        // Tax paid on expenses
        const expenseTax = await prisma.transaction.aggregate({
            where: {
                businessId,
                type: 'EXPENSE',
                occurredAt: dateFilter,
            },
            _sum: {
                taxCents: true,
            },
        });

        const taxCollected = BigInt(incomeTax._sum.taxCents ?? 0);
        const taxPaid = BigInt(expenseTax._sum.taxCents ?? 0);
        const netTaxPayable = taxCollected - taxPaid;

        return res.json({
            taxCollectedCents: taxCollected.toString(),
            taxPaidCents: taxPaid.toString(),
            netTaxPayableCents: netTaxPayable.toString(),
        });

    } catch (err) {
        console.error('Tax summary failed:', err);
        return res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
});

/**
 * --------------------------------------------------------
 * GET /api/summary/profit
 * Returns:
 *  - total income
 *  - total expenses
 *  - net profit
 * --------------------------------------------------------
 */
router.get('/profit', async (req, res) => {
    try {
        const businessId = req.context?.businessId;
        if (!businessId) {
            return res.status(401).json({ error: 'UNAUTHORIZED' });
        }

        const from = req.query.from as string | undefined;
        const to = req.query.to as string | undefined;

        const dateFilter = buildDateFilter(from, to);

        // Aggregate income
        const incomeResult = await prisma.transaction.aggregate({
            where: {
                businessId,
                type: 'INCOME',
                occurredAt: dateFilter,
            },
            _sum: {
                amountCents: true,
            },
        });

        // Aggregate expenses
        const expenseResult = await prisma.transaction.aggregate({
            where: {
                businessId,
                type: 'EXPENSE',
                occurredAt: dateFilter,
            },
            _sum: {
                amountCents: true,
            },
        });

        const totalIncome = BigInt(incomeResult._sum.amountCents ?? 0);
        const totalExpenses = BigInt(expenseResult._sum.amountCents ?? 0);
        const netProfit = totalIncome - totalExpenses;

        return res.json({
            totalIncomeCents: totalIncome.toString(),
            totalExpenseCents: totalExpenses.toString(),
            netProfitCents: netProfit.toString(),
        });

    } catch (err) {
        console.error('Profit summary failed:', err);
        return res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
});

export default router;
