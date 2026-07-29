-- CreateEnum
CREATE TYPE "LegalDocumentType" AS ENUM ('TERMS_OF_USE', 'PRIVACY_POLICY');

-- CreateEnum
CREATE TYPE "ConsentSubjectType" AS ENUM ('USER', 'CLIENT');

-- CreateEnum
CREATE TYPE "DataSubjectRequestType" AS ENUM ('ACCESS', 'CORRECTION', 'DELETION', 'PORTABILITY', 'CONSENT_REVOCATION');

-- CreateEnum
CREATE TYPE "DataSubjectRequestStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED');

-- CreateTable
CREATE TABLE "LegalDocument" (
    "id" TEXT NOT NULL,
    "type" "LegalDocumentType" NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "subjectType" "ConsentSubjectType" NOT NULL,
    "subjectId" TEXT NOT NULL,
    "legalDocumentId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataSubjectRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "subjectType" "ConsentSubjectType" NOT NULL,
    "subjectId" TEXT,
    "requesterName" TEXT NOT NULL,
    "requesterContact" TEXT NOT NULL,
    "requestType" "DataSubjectRequestType" NOT NULL,
    "description" TEXT,
    "status" "DataSubjectRequestStatus" NOT NULL DEFAULT 'OPEN',
    "resolutionNotes" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "DataSubjectRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LegalDocument_type_active_idx" ON "LegalDocument"("type", "active");

-- CreateIndex
CREATE UNIQUE INDEX "LegalDocument_type_version_key" ON "LegalDocument"("type", "version");

-- CreateIndex
CREATE INDEX "ConsentRecord_tenantId_idx" ON "ConsentRecord"("tenantId");

-- CreateIndex
CREATE INDEX "ConsentRecord_subjectType_subjectId_idx" ON "ConsentRecord"("subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "ConsentRecord_legalDocumentId_idx" ON "ConsentRecord"("legalDocumentId");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_tenantId_idx" ON "DataSubjectRequest"("tenantId");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_status_idx" ON "DataSubjectRequest"("status");

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_legalDocumentId_fkey" FOREIGN KEY ("legalDocumentId") REFERENCES "LegalDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataSubjectRequest" ADD CONSTRAINT "DataSubjectRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

