-- Ejecutar conectado a la base "postgres" (Query Tool de pgAdmin).
-- CREATE DATABASE no puede ir dentro de una transacción: ejecuta cada línea
-- por separado o selecciónalas todas y pulsa F5 (pgAdmin las corre una a una).
-- Si una base ya existe, esa línea da error y puedes ignorarlo.
CREATE DATABASE delivery_auth_db;
CREATE DATABASE delivery_order_db;
CREATE DATABASE delivery_delivery_db;
CREATE DATABASE delivery_notification_db;
