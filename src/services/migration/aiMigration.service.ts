import OpenAI from 'openai';
import { validateParsedMigrationData } from './migrationValidation.service';
import type { ParsedMigrationData } from './migrationTypes';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const migrationResponseSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        customers: {
            type: 'array',
            items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    name: { type: 'string' },
                    email: { type: ['string', 'null'] },
                    phone: { type: ['string', 'null'] },
                    address: { type: ['string', 'null'] },
                    sourceRowNumber: { type: ['number', 'null'] },
                },
                required: ['name', 'email', 'phone', 'address', 'sourceRowNumber'],
            },
        },
        transactions: {
            type: 'array',
            items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    type: {
                        type: 'string',
                        enum: ['INCOME', 'EXPENSE'],
                    },
                    description: { type: ['string', 'null'] },
                    category: { type: 'string' },
                    amountCents: { type: 'integer' },
                    taxCents: { type: 'integer' },
                    currency: {
                        type: 'string',
                        enum: ['CAD'],
                    },
                    occurredAt: { type: 'string' },
                    customerEmail: { type: ['string', 'null'] },
                    sourceRowNumber: { type: ['number', 'null'] },
                },
                required: [
                    'type',
                    'description',
                    'category',
                    'amountCents',
                    'taxCents',
                    'currency',
                    'occurredAt',
                    'customerEmail',
                    'sourceRowNumber',
                ],
            },
        },
        invoices: {
            type: 'array',
            items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    invoiceNumber: { type: ['string', 'null'] },
                    customerEmail: { type: ['string', 'null'] },
                    status: { type: ['string', 'null'] },
                    description: { type: ['string', 'null'] },
                    subtotalCents: { type: ['integer', 'null'] },
                    taxCents: { type: ['integer', 'null'] },
                    totalCents: { type: ['integer', 'null'] },
                    currency: {
                        type: ['string', 'null'],
                        enum: ['CAD', null],
                    },
                    issuedAt: { type: ['string', 'null'] },
                    paidAt: { type: ['string', 'null'] },
                    sourceRowNumber: { type: ['number', 'null'] },
                },
                required: [
                    'invoiceNumber',
                    'customerEmail',
                    'status',
                    'description',
                    'subtotalCents',
                    'taxCents',
                    'totalCents',
                    'currency',
                    'issuedAt',
                    'paidAt',
                    'sourceRowNumber',
                ],
            },
        },
        skipped: {
            type: 'array',
            items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    sourceRowNumber: { type: ['number', 'null'] },
                    reason: { type: 'string' },
                    raw: { type: ['string', 'null'] },
                },
                required: ['sourceRowNumber', 'reason', 'raw'],
            },
        },
    },
    required: ['customers', 'transactions', 'invoices', 'skipped'],
};

function buildMigrationInstructions() {
    return `
You are a data migration assistant for ClearBooks, a small business bookkeeping app.

Your job:
Parse the uploaded CSV data and map it into ClearBooks' canonical migration format.

Rules:
- Return only JSON that matches the provided schema.
- Do not include markdown.
- Do not include explanations.
- Do not guess missing values.
- Use null for missing or ambiguous fields.
- Normalize money values into integer cents.
- Normalize all dates to full ISO 8601 strings, for example 2026-05-01T00:00:00.000Z.
- Use CAD as the currency for Migration V1.
- If a row cannot be mapped safely, add it to skipped with a clear reason.
- If a row looks like business income, use type INCOME.
- If a row looks like an expense, use type EXPENSE.
- Only create customers from income, invoice, or customer/client rows.
- Do not create customers from expense vendors, stores, merchants, gas stations, suppliers, or payees.
- If an expense row has a vendor or merchant name, keep it in the transaction description if helpful, but do not add it to customers.
- If a customer cannot be identified, customerEmail can be null.
- Preserve source row numbers where possible.
- Invoices can be included in the invoices array for preview, but Migration V1 may not import them yet.
`;
}

export async function parseMigrationCsvWithAi(
    csvText: string
): Promise<ParsedMigrationData> {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not configured');
    }

    const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

    const response = await openai.chat.completions.create({
        model,
        temperature: 0,
        max_tokens: 4096,
        response_format: {
            type: 'json_schema',
            json_schema: {
                name: 'clearbooks_migration_parse',
                strict: true,
                schema: migrationResponseSchema,
            },
        },
        messages: [
            {
                role: 'system',
                content: buildMigrationInstructions(),
            },
            {
                role: 'user',
                content: `CSV content:\n\n${csvText}`,
            },
        ],
    });

    const responseText = response.choices[0]?.message?.content;

    if (!responseText) {
        throw new Error('OpenAI did not return migration data');
    }

    let parsed: unknown;

    try {
        parsed = JSON.parse(responseText);
    } catch {
        throw new Error('OpenAI returned invalid JSON');
    }

    return validateParsedMigrationData(parsed);
}