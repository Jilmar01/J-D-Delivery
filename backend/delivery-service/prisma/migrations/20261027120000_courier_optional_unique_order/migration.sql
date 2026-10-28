-- AlterTable
ALTER TABLE "deliveries" ALTER COLUMN "courierId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "deliveries_orderId_key" ON "deliveries"("orderId");

