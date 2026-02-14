import { Router } from 'express';
import prisma from '../config/prisma';

const router = Router();

router.post('/', async (req, res) => {
    try {
        const businessId = req.context?.businessId;

        if (!businessId) {
            return res.status(401).json({ error: 'UNAUTHORIZED' });
        }

        const {
            effectiveDate,
            cashCents,
            receivablesCents,
            payablesCents,
            taxPayableCents,
        } = req.body;

        // Basic validation
        if (
            !effectiveDate ||
            cashCents == null ||
            receivablesCents == null ||
            payablesCents == null ||
            taxPayableCents == null
        ) {
            return res.status(400).json({ error: 'MISSING_FIELDS' });
        }

        if (
            cashCents < 0 ||
            receivablesCents < 0 ||
            payablesCents < 0 ||
            taxPayableCents < 0
        ) {
            return res.status(400).json({ error: 'INVALID_AMOUNT' });
        }

        // Check if already exists
        const existing = await prisma.openingSnapshot.findUnique({
            where: { businessId },
        });

        if (existing) {
            return res.status(400).json({
                error: 'SNAPSHOT_ALREADY_EXISTS',
            });
        }

        const snapshot = await prisma.openingSnapshot.create({
            data: {
                businessId,
                effectiveDate: new Date(effectiveDate),
                cashCents,
                receivablesCents,
                payablesCents,
                taxPayableCents,
                declaredByUser: true,
                locked: true,
            },
        });

        res.status(201).json(snapshot);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
});

export default router;
