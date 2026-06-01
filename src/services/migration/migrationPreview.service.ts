import { MigrationSourceSoftware, Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import { parseMigrationCsvWithAi } from './aiMigration.service';
import type {
    MigrationPreviewResponse,
    MigrationPreviewSamples,
    MigrationPreviewSummary,
    ParsedMigrationData,
} from './migrationTypes';

function getExpiryDate() {
    const hours = Number(process.env.MIGRATION_SESSION_EXPIRY_HOURS || 24);

    const expiry = new Date();
    expiry.setHours(expiry.getHours() + hours);

    return expiry;
}

function buildSummary(data: ParsedMigrationData): MigrationPreviewSummary {
    return {
        customers: data.customers.length,
        transactions: data.transactions.length,
        invoices: data.invoices.length,
        skipped: data.skipped.length,
    };
}

function buildSamples(data: ParsedMigrationData): MigrationPreviewSamples {
    return {
        customers: data.customers.slice(0, 3),
        transactions: data.transactions.slice(0, 3),
        invoices: data.invoices.slice(0, 3),
    };
}

function parseSourceSoftware(value: unknown): MigrationSourceSoftware | undefined {
    if (!value || typeof value !== 'string') {
        return undefined;
    }

    const normalized = value.toUpperCase();

    if (
        normalized === 'QUICKBOOKS' ||
        normalized === 'WAVE' ||
        normalized === 'FRESHBOOKS' ||
        normalized === 'XERO' ||
        normalized === 'SAGE' ||
        normalized === 'OTHER'
    ) {
        return normalized as MigrationSourceSoftware;
    }

    return undefined;
}

type CreateMigrationPreviewInput = {
    businessId: string;
    userId: string;
    file: Express.Multer.File;
    sourceSoftware?: unknown;
};

export async function createMigrationPreview({
                                                 businessId,
                                                 userId,
                                                 file,
                                                 sourceSoftware,
                                             }: CreateMigrationPreviewInput): Promise<MigrationPreviewResponse> {
    const csvText = file.buffer.toString('utf-8').trim();

    if (!csvText) {
        throw new Error('Uploaded CSV file is empty');
    }

    const parsedData = await parseMigrationCsvWithAi(csvText);

    const summary = buildSummary(parsedData);
    const samples = buildSamples(parsedData);

    const session = await prisma.migrationSession.create({
        data: {
            businessId,
            createdByUserId: userId,
            sourceSoftware: parseSourceSoftware(sourceSoftware),
            originalFileName: file.originalname,
            originalFileType: file.mimetype,
            originalFileSize: file.size,
            parsedData: parsedData as unknown as Prisma.InputJsonValue,
            previewSummary: summary as unknown as Prisma.InputJsonValue,
            skippedDetails: parsedData.skipped as unknown as Prisma.InputJsonValue,
            expiresAt: getExpiryDate(),
        },
    });

    return {
        sessionId: session.id,
        status: 'PENDING',
        summary,
        samples,
        skipped: parsedData.skipped,
    };
}