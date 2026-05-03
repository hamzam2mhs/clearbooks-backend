-- CreateEnum
CREATE TYPE "MigrationSessionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MigrationSourceSoftware" AS ENUM ('QUICKBOOKS', 'WAVE', 'FRESHBOOKS', 'XERO', 'SAGE', 'OTHER');

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MigrationSession" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "sourceSoftware" "MigrationSourceSoftware",
    "originalFileName" TEXT,
    "originalFileType" TEXT,
    "originalFileSize" INTEGER,
    "status" "MigrationSessionStatus" NOT NULL DEFAULT 'PENDING',
    "parsedData" JSONB NOT NULL,
    "previewSummary" JSONB,
    "skippedDetails" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MigrationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MigrationLog" (
    "id" TEXT NOT NULL,
    "migrationSessionId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "confirmedByUserId" TEXT NOT NULL,
    "customersImported" INTEGER NOT NULL DEFAULT 0,
    "invoicesImported" INTEGER NOT NULL DEFAULT 0,
    "transactionsImported" INTEGER NOT NULL DEFAULT 0,
    "recordsSkipped" INTEGER NOT NULL DEFAULT 0,
    "skippedDetails" JSONB,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MigrationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_businessId_email_key" ON "Customer"("businessId", "email");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MigrationSession" ADD CONSTRAINT "MigrationSession_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MigrationSession" ADD CONSTRAINT "MigrationSession_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MigrationLog" ADD CONSTRAINT "MigrationLog_migrationSessionId_fkey" FOREIGN KEY ("migrationSessionId") REFERENCES "MigrationSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MigrationLog" ADD CONSTRAINT "MigrationLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MigrationLog" ADD CONSTRAINT "MigrationLog_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
