# ClearBooks Backend

## Purpose
ClearBooks is a mobile-first bookkeeping platform for solo service businesses in Canada.
The backend is the system of record for all financial data.

## Non-Negotiable Architecture Rules

1. Single PostgreSQL database (multi-tenant via business_id)
2. One business per user (V1)
3. Opening snapshot is mandatory before any transactions
4. Ledger is append-only (no silent edits or deletes)
5. AI suggestions are never confirmed automatically
6. Only user-confirmed transactions affect financial totals
7. Past financial data is never mutated; corrections are additive
8. Backend is the source of truth; clients never calculate totals

If a change violates any of the above, it must not be merged.
