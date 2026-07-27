-- AlterEnum
BEGIN;
CREATE TYPE "FiscalDocumentType_new" AS ENUM ('NFSE', 'NFE', 'NFCE');
ALTER TABLE "FiscalDocument" ALTER COLUMN "documentType" TYPE "FiscalDocumentType_new" USING ("documentType"::text::"FiscalDocumentType_new");
ALTER TYPE "FiscalDocumentType" RENAME TO "FiscalDocumentType_old";
ALTER TYPE "FiscalDocumentType_new" RENAME TO "FiscalDocumentType";
DROP TYPE "FiscalDocumentType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Commission" ADD COLUMN     "saleItemId" TEXT;

-- AlterTable
ALTER TABLE "SaleItem" ADD COLUMN     "professionalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Commission_saleItemId_key" ON "Commission"("saleItemId");

-- CreateIndex
CREATE INDEX "SaleItem_professionalId_idx" ON "SaleItem"("professionalId");

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
