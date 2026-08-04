-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "importJobId" TEXT;

-- CreateIndex
CREATE INDEX "Client_importJobId_idx" ON "Client"("importJobId");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "MigrationJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;
