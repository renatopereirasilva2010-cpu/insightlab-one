-- AlterTable
ALTER TABLE "Unit" ADD COLUMN     "addressComplement" TEXT,
ADD COLUMN     "addressLine1" TEXT,
ADD COLUMN     "addressNumber" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "cnpj" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "ibgeCityCode" TEXT,
ADD COLUMN     "legalName" TEXT,
ADD COLUMN     "municipalRegistration" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "stateRegistration" TEXT,
ADD COLUMN     "tradeName" TEXT;

-- CreateIndex
CREATE INDEX "Unit_cnpj_idx" ON "Unit"("cnpj");

-- CreateIndex
CREATE INDEX "Unit_city_state_idx" ON "Unit"("city", "state");
