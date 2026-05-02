import { Router } from 'express';
import prisma from '../config/prisma';

const router = Router();

/**
 * GET /api/periods
 * Lists reporting periods for the authenticated business
 */
router.get('/', async (req, res) => {
    try {
        const businessId = req.context?.businessId;

        if (!businessId) {
            return res.status(401).json({ error: 'UNAUTHORIZED' });
        }

        const periods = await prisma.reportingPeriod.findMany({
            where: { businessId },
            orderBy: { startDate: 'desc' },
        });

        return res.json(periods);
    } catch (err) {
        console.error('List periods failed:', err);
        return res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
});

/**
 * PATCH /api/periods/:id/lock
 * Locks a reporting period
 */
router.patch('/:id/lock', async (req, res) => {
    try {
        const businessId = req.context?.businessId;

        if (!businessId) {
            return res.status(401).json({ error: 'UNAUTHORIZED' });
        }

        const { id } = req.params;

        const period = await prisma.reportingPeriod.findFirst({
            where: {
                id,
                businessId,
            },
        });

        if (!period) {
            return res.status(404).json({ error: 'PERIOD_NOT_FOUND' });
        }

        const updated = await prisma.reportingPeriod.update({
            where: { id },
            data: { locked: true },
        });

        return res.json(updated);
    } catch (err) {
        console.error('Lock period failed:', err);
        return res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
});

export default router;