-- Abrir Query Tool sobre la base delivery_delivery_db y ejecutar.
-- Es la base que usa el servidor TCP de concurrencia (DATABASE_URL) y delivery-service.
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

CREATE TABLE "deliveries" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "courierId" INTEGER,
    "deliveryAddress" TEXT NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "assignedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "delivery_history" (
    "id" SERIAL NOT NULL,
    "deliveryId" INTEGER NOT NULL,
    "previousStatus" "DeliveryStatus",
    "newStatus" "DeliveryStatus" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "delivery_history_pkey" PRIMARY KEY ("id")
);

-- Un pedido solo puede tener una entrega: es la red de seguridad de la asignación concurrente
CREATE UNIQUE INDEX "deliveries_orderId_key" ON "deliveries"("orderId");

ALTER TABLE "delivery_history" ADD CONSTRAINT "delivery_history_deliveryId_fkey"
    FOREIGN KEY ("deliveryId") REFERENCES "deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
