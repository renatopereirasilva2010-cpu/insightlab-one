/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,sourceType,sourceId,documentType]` on the table `FiscalDocument` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "FiscalDocument_tenantId_sourceType_sourceId_documentType_key" ON "FiscalDocument"("tenantId", "sourceType", "sourceId", "documentType");
