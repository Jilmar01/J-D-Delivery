-- =============================================================================
-- J&D DELIVERY - BASE DE DATOS COMPLETA (4 bases, una por microservicio)
-- Ejecutar con psql (en pgAdmin: Tools > PSQL Tool):
--     \i 'D:/ruta/al/proyecto/JD-Delivery/backend/database/todo_el_proyecto.sql'
-- o desde la terminal:
--     psql -U postgres -f todo_el_proyecto.sql
-- Usa meta-comandos de psql (\connect): NO funciona pegado en el Query Tool.
-- Si las bases ya existen, los CREATE DATABASE dan error y se pueden ignorar.
-- =============================================================================

CREATE DATABASE delivery_auth_db;
CREATE DATABASE delivery_order_db;
CREATE DATABASE delivery_delivery_db;
CREATE DATABASE delivery_notification_db;

\connect delivery_auth_db
-- ----- delivery_auth_db -----
-- Abrir Query Tool sobre la base delivery_auth_db y ejecutar. (auth-service)
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'DELIVERY_PERSON', 'ADMIN');

CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

\connect delivery_order_db
-- ----- delivery_order_db -----
-- Abrir Query Tool sobre la base delivery_order_db y ejecutar. (order-service)
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "customerId" TEXT NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "notes" TEXT,
    "total" DECIMAL(10,2) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deliveryLat" DECIMAL(9,6),
    "deliveryLng" DECIMAL(9,6),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_items" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

\connect delivery_delivery_db
-- ----- delivery_delivery_db -----
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

\connect delivery_notification_db
-- ----- delivery_notification_db -----
-- Abrir Query Tool sobre la base delivery_notification_db y ejecutar. (notification-service)
CREATE TYPE "NotificationType" AS ENUM ('ORDER_CREATED', 'ORDER_UPDATED', 'ORDER_CANCELLED', 'DELIVERY_ASSIGNED', 'DELIVERY_UPDATED', 'DELIVERY_COMPLETED');

CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "orderId" INTEGER,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

