export type MigratedCustomer = {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    sourceRowNumber: number | null;
};

export type MigratedTransaction = {
    type: 'INCOME' | 'EXPENSE';
    description: string | null;
    category: string;
    amountCents: number;
    taxCents: number;
    currency: string;
    occurredAt: string;
    customerEmail: string | null;
    sourceRowNumber: number | null;
};

export type MigratedInvoice = {
    invoiceNumber: string | null;
    customerEmail: string | null;
    status: string | null;
    description: string | null;
    subtotalCents: number | null;
    taxCents: number | null;
    totalCents: number | null;
    currency: string | null;
    issuedAt: string | null;
    paidAt: string | null;
    sourceRowNumber: number | null;
};

export type SkippedMigrationRow = {
    sourceRowNumber: number | null;
    reason: string;
    raw: string | null;
};

export type ParsedMigrationData = {
    customers: MigratedCustomer[];
    transactions: MigratedTransaction[];
    invoices: MigratedInvoice[];
    skipped: SkippedMigrationRow[];
};

export type MigrationPreviewSummary = {
    customers: number;
    transactions: number;
    invoices: number;
    skipped: number;
};

export type MigrationPreviewSamples = {
    customers: MigratedCustomer[];
    transactions: MigratedTransaction[];
    invoices: MigratedInvoice[];
};

export type MigrationPreviewResponse = {
    sessionId: string;
    status: 'PENDING';
    summary: MigrationPreviewSummary;
    samples: MigrationPreviewSamples;
    skipped: SkippedMigrationRow[];
};