-- CreateEnum
CREATE TYPE "FiscalDocumentSourceType" AS ENUM ('SALE', 'PAYMENT', 'MANUAL');

-- CreateEnum
CREATE TYPE "FiscalDocumentType" AS ENUM ('NFSE', 'NFE', 'NFCE', 'OTHER');

-- CreateEnum
CREATE TYPE "FiscalDocumentStatus" AS ENUM ('DRAFT', 'REQUESTED', 'AUTHORIZED', 'CANCELED', 'FAILED');

-- CreateEnum
CREATE TYPE "FiscalDocumentEventType" AS ENUM ('CREATED', 'REQUESTED', 'AUTHORIZED', 'CANCELED', 'ERROR', 'NOTE');

-- CreateTable
CREATE TABLE "FiscalDocument" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "unitId" TEXT,
    "sourceType" "FiscalDocumentSourceType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "documentType" "FiscalDocumentType" NOT NULL,
    "status" "FiscalDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "provider" TEXT,
    "referenceNumber" TEXT,
    "accessKey" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "requestedAt" TIMESTAMP(3),
    "authorizedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalDocumentEvent" (
    "id" TEXT NOT NULL,
    "fiscalDocumentId" TEXT NOT NULL,
    "eventType" "FiscalDocumentEventType" NOT NULL,
    "message" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FiscalDocumentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FiscalDocument_tenantId_idx" ON "FiscalDocument"("tenantId");

-- CreateIndex
CREATE INDEX "FiscalDocument_unitId_idx" ON "FiscalDocument"("unitId");

-- CreateIndex
CREATE INDEX "FiscalDocument_sourceType_sourceId_idx" ON "FiscalDocument"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "FiscalDocument_documentType_idx" ON "FiscalDocument"("documentType");

-- CreateIndex
CREATE INDEX "FiscalDocument_status_idx" ON "FiscalDocument"("status");

-- CreateIndex
CREATE INDEX "FiscalDocument_referenceNumber_idx" ON "FiscalDocument"("referenceNumber");

-- CreateIndex
CREATE INDEX "FiscalDocument_accessKey_idx" ON "FiscalDocument"("accessKey");

-- CreateIndex
CREATE INDEX "FiscalDocumentEvent_fiscalDocumentId_idx" ON "FiscalDocumentEvent"("fiscalDocumentId");

-- CreateIndex
CREATE INDEX "FiscalDocumentEvent_eventType_idx" ON "FiscalDocumentEvent"("eventType");

-- CreateIndex
CREATE INDEX "FiscalDocumentEvent_createdAt_idx" ON "FiscalDocumentEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "FiscalDocument" ADD CONSTRAINT "FiscalDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalDocument" ADD CONSTRAINT "FiscalDocument_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalDocumentEvent" ADD CONSTRAINT "FiscalDocumentEvent_fiscalDocumentId_fkey" FOREIGN KEY ("fiscalDocumentId") REFERENCES "FiscalDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
