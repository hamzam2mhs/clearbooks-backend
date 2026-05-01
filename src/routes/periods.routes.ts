import { Router } from 'express';
import prisma from '../config/prisma';

const router = Router();

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


// curl -X PATCH http://localhost:3000/api/periods/56f775c1-c85b-430e-b6d4-10f0d17899fa/lock -H "Authorization: Bearer eyJraWQiOiJmeG1Da3dDNW0wT0pRUTBlMVVFXC9hTHlhRXVLRjhqUG55Q3E4cndpV2NYdz0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIwY2NkMjVjOC01MDkxLTcwOGQtYTc0Ny01ZTE4ZjBmZDM5MDUiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuY2EtY2VudHJhbC0xLmFtYXpvbmF3cy5jb21cL2NhLWNlbnRyYWwtMV9nWEtDcTdBQWwiLCJjbGllbnRfaWQiOiIyNWlva3BlZ2lqaWYzZWlxcDdkcjcyamdibSIsIm9yaWdpbl9qdGkiOiJlMWM4MzE4Yy03NGE2LTQ5YTktYTk4ZS03NWVkZDhiODA3ZjgiLCJldmVudF9pZCI6Ijk3ZGNjMDY4LTk1NjEtNGI3Zi1hZTVhLTljMTBmZWJhZjYwZiIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE3NzIzMTY5MjQsImV4cCI6MTc3MjMyMDUyNCwiaWF0IjoxNzcyMzE2OTI0LCJqdGkiOiJlNTU2NzgzOC1lNDYwLTRkMTYtYThiMi0zNjY5YWIyMjhkNWQiLCJ1c2VybmFtZSI6IjBjY2QyNWM4LTUwOTEtNzA4ZC1hNzQ3LTVlMThmMGZkMzkwNSJ9.bI3AGqf831QQvCbePgCofTxkWm-GjSDxZuXy4dK3Bb70U7GeWO7RsS2lX4fVls-Waj156uNTe4lenGB-BoNtA5gjoCeVlmH-f8UoBmTo8VeMLcCmgKYsj0-iBTfJVBBfPy7Wuw_AT21igz8Y-QmLin00-dPI2gtp7RsiPLa4A0iSFLiNiNIDBXHlz6IeOhk8vHD9gcsPM3uIcRtb1ryDqrsyfs5AqPkD-O-j10omQP-Cjr6i40dY23zot365kKKxuE3QyNx2vQ6-YKZr_mZ_iA3ehU6mnUedxWjeb-k7P5EwnOJUwmyITGkJRPmlQaOFaXTKt5FiYPSrRAMDEmvImQ"

// curl -X GET http://localhost:3000/api/periods -H "Authorization: Bearer eyJraWQiOiJmeG1Da3dDNW0wT0pRUTBlMVVFXC9hTHlhRXVLRjhqUG55Q3E4cndpV2NYdz0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIwY2NkMjVjOC01MDkxLTcwOGQtYTc0Ny01ZTE4ZjBmZDM5MDUiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuY2EtY2VudHJhbC0xLmFtYXpvbmF3cy5jb21cL2NhLWNlbnRyYWwtMV9nWEtDcTdBQWwiLCJjbGllbnRfaWQiOiIyNWlva3BlZ2lqaWYzZWlxcDdkcjcyamdibSIsIm9yaWdpbl9qdGkiOiIzNDdkNDcxYy1iMTFmLTRjZGUtOGI2NC1iNTFjOGI5ZmQ5NTkiLCJldmVudF9pZCI6IjM0ZWJhY2FlLTY4ZGQtNGQzYS05YjQ3LWVmNmRhOTRjMGRiZiIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE3NzIzMjExNTQsImV4cCI6MTc3MjMyNDc1NCwiaWF0IjoxNzcyMzIxMTU0LCJqdGkiOiIzODZkYzZlOS1hOGQxLTQ3ZDgtODc4NS0zMzkxY2ZhYTJlYzgiLCJ1c2VybmFtZSI6IjBjY2QyNWM4LTUwOTEtNzA4ZC1hNzQ3LTVlMThmMGZkMzkwNSJ9.ZhhJPQnIHoZwGZS1CxS5GgTNlSrBK54BmTxp0Y-F1y7hsAJSvUg0rn0EWfKW3YFIE5MPAeA7wLPeO3rXT6xMsYHG_Pp_a5OqojvUzmMNxpAaoTkqxbahEZBBc2-V3YTlmkxEsx0sSGZPQUpqe77fXQ0bmacDmdAGpsWnSrqYQzvpnhVLzeCDlroXmR-3aigYPS9pxYtTrTTUw4bQuqK_RnQEmrn6DKRbUAIUSt8oP1qeJkI9j0e_io4MAjGFwn5DF8d5lNcX-_iH7_K2KuTl28wEod2r5ok0RYEZDRxwnkIuz5FvPrrmJdS59L_f7MzJ19JXRwp5lq5hawD_N0H1Og"