import type { ParsedMigrationData } from './migrationTypes';

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidTransactionType(value: unknown) {
    return value === 'INCOME' || value === 'EXPENSE';
}

function isValidIsoDate(value: unknown) {
    if (typeof value !== 'string') return false;

    const parsed = new Date(value);
    return !Number.isNaN(parsed.getTime());
}

function isInteger(value: unknown) {
    return Number.isInteger(value);
}

export function validateParsedMigrationData(data: unknown): ParsedMigrationData {
    if (!isObject(data)) {
        throw new Error('AI returned invalid migration data');
    }

    const customers = data.customers;
    const transactions = data.transactions;
    const invoices = data.invoices;
    const skipped = data.skipped;

    if (
        !Array.isArray(customers) ||
        !Array.isArray(transactions) ||
        !Array.isArray(invoices) ||
        !Array.isArray(skipped)
    ) {
        throw new Error('AI response is missing required arrays');
    }

    for (const transaction of transactions) {
        if (!isObject(transaction)) {
            throw new Error('Invalid transaction row in AI response');
        }

        if (!isValidTransactionType(transaction.type)) {
            throw new Error('Invalid transaction type in AI response');
        }

        if (
            !isInteger(transaction.amountCents) ||
            Number(transaction.amountCents) <= 0
        ) {
            throw new Error('Invalid transaction amount in AI response');
        }

        if (
            !isInteger(transaction.taxCents) ||
            Number(transaction.taxCents) < 0
        ) {
            throw new Error('Invalid transaction tax amount in AI response');
        }

        if (transaction.currency !== 'CAD') {
            throw new Error('Only CAD currency is supported for Migration V1');
        }

        if (!isValidIsoDate(transaction.occurredAt)) {
            throw new Error('Invalid transaction date in AI response');
        }

        if (
            typeof transaction.category !== 'string' ||
            !transaction.category.trim()
        ) {
            throw new Error('Invalid transaction category in AI response');
        }
    }

    return {
        customers: customers as ParsedMigrationData['customers'],
        transactions: transactions as ParsedMigrationData['transactions'],
        invoices: invoices as ParsedMigrationData['invoices'],
        skipped: skipped as ParsedMigrationData['skipped'],
    };
}