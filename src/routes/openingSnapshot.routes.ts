import { Router } from 'express';
import prisma from '../config/prisma';

const router = Router();

function serializeOpeningSnapshot(snapshot: any) {
    if (!snapshot) return null;

    return {
        ...snapshot,
        cashCents: snapshot.cashCents.toString(),
        receivablesCents: snapshot.receivablesCents.toString(),
        payablesCents: snapshot.payablesCents.toString(),
        taxPayableCents: snapshot.taxPayableCents.toString(),
    };
}

// GET existing opening snapshot
router.get('/', async (req, res) => {
    try {
        const businessId = req.context?.businessId;

        if (!businessId) {
            return res.status(401).json({ error: 'UNAUTHORIZED' });
        }

        const snapshot = await prisma.openingSnapshot.findUnique({
            where: { businessId },
        });

        return res.json(serializeOpeningSnapshot(snapshot));
    } catch (err) {
        console.error('Get opening snapshot failed:', err);
        return res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
});

// CREATE opening snapshot
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

        return res.status(201).json(serializeOpeningSnapshot(snapshot));
    } catch (err) {
        console.error('Create opening snapshot failed:', err);
        return res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
});

export default router;