-- CreateEnum
CREATE TYPE "SupplyMovementType" AS ENUM ('ENTRY', 'SALE_CONSUMPTION', 'INTERNAL_USE', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "SupplyMovement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "unitId" TEXT,
    "supplyItemId" TEXT NOT NULL,
    "type" "SupplyMovementType" NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "baseQuantity" DECIMAL(12,4) NOT NULL,
    "reason" TEXT,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "performedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplyMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupplyMovement_tenantId_idx" ON "SupplyMovement"("tenantId");

-- CreateIndex
CREATE INDEX "SupplyMovement_supplyItemId_idx" ON "SupplyMovement"("supplyItemId");

-- CreateIndex
CREATE INDEX "SupplyMovement_createdAt_idx" ON "SupplyMovement"("createdAt");

-- AddForeignKey
ALTER TABLE "SupplyMovement" ADD CONSTRAINT "SupplyMovement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplyMovement" ADD CONSTRAINT "SupplyMovement_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplyMovement" ADD CONSTRAINT "SupplyMovement_supplyItemId_fkey" FOREIGN KEY ("supplyItemId") REFERENCES "SupplyItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

