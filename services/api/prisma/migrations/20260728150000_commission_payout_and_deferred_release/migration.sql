-- CreateEnum
CREATE TYPE "PixKeyType" AS ENUM ('CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM');

-- CreateEnum
CREATE TYPE "PayoutMethod" AS ENUM ('PIX', 'BANK_TRANSFER', 'MANUAL');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'SCHEDULED', 'PAID', 'FAILED', 'CANCELED');

-- AlterTable
ALTER TABLE "BusinessSettings" ADD COLUMN     "commissionReleaseAllowDeferred" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Professional" ADD COLUMN     "payoutPixKey" TEXT,
ADD COLUMN     "payoutPixKeyType" "PixKeyType";

-- CreateTable
CREATE TABLE "CommissionPayout" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "unitId" TEXT,
    "professionalId" TEXT NOT NULL,
    "commissionId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "PayoutMethod" NOT NULL DEFAULT 'PIX',
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT,
    "providerReference" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionPayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommissionPayout_commissionId_key" ON "CommissionPayout"("commissionId");

-- CreateIndex
CREATE INDEX "CommissionPayout_tenantId_idx" ON "CommissionPayout"("tenantId");

-- CreateIndex
CREATE INDEX "CommissionPayout_unitId_idx" ON "CommissionPayout"("unitId");

-- CreateIndex
CREATE INDEX "CommissionPayout_professionalId_idx" ON "CommissionPayout"("professionalId");

-- CreateIndex
CREATE INDEX "CommissionPayout_status_idx" ON "CommissionPayout"("status");

-- AddForeignKey
ALTER TABLE "CommissionPayout" ADD CONSTRAINT "CommissionPayout_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionPayout" ADD CONSTRAINT "CommissionPayout_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionPayout" ADD CONSTRAINT "CommissionPayout_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionPayout" ADD CONSTRAINT "CommissionPayout_commissionId_fkey" FOREIGN KEY ("commissionId") REFERENCES "Commission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

