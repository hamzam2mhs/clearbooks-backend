import prisma from '../config/prisma';

export async function ensureMonthlyPeriod(
    businessId: string,
    date: Date
) {
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const existing = await prisma.reportingPeriod.findFirst({
        where: {
            businessId,
            startDate,
            endDate,
        },
    });

    if (existing) return existing;

    return prisma.reportingPeriod.create({
        data: {
            businessId,
            startDate,
            endDate,
            type: 'MONTHLY',
        },
    });
}