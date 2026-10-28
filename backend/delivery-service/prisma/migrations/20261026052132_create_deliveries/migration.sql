-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "deliveries" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "courierId" INTEGER NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "assignedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_history" (
    "id" SERIAL NOT NULL,
    "deliveryId" INTEGER NOT NULL,
    "previousStatus" "DeliveryStatus",
    "newStatus" "DeliveryStatus" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "delivery_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "delivery_history" ADD CONSTRAINT "delivery_history_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
