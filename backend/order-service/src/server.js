import express from "express";
import dotenv from "dotenv";
import { createServer } from "node:http";
import { prisma } from "../config/database.js";
import { iniciarWebSocketPedidos } from "./services/pedidoEvents.js";

// Rutas de Endpoints
import pedidoRoutes from "./routes/pedido.routes.js";

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT) || 3001;
const SERVICE_NAME = process.env.SERVICE_NAME || "order-service";
const origenesPermitidos = new Set(
  (
    process.env.FRONTEND_ORIGINS ||
    "http://localhost:5173,http://127.0.0.1:5173"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);

// Middlewares globales
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (!origin) {
    return next();
  }

  if (!origenesPermitidos.has(origin)) {
    return res.status(403).json({
      success: false,
      message: "Origen no permitido",
    });
  }

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});
app.use(express.json());

// Ruta principal
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    service: SERVICE_NAME,
    message: "Microservicio de pedidos funcionando",
  });
});

// Ruta pedidos
app.use("/api/pedidos", pedidoRoutes);

// Endpoint de salud
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: SERVICE_NAME,
    status: "UP",
    timestamp: new Date().toISOString(),
  });
});

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada",
    path: req.originalUrl,
  });
});

// Manejo básico de errores
app.use((err, req, res, next) => {
  console.error("Error en el servidor:", err);

  res.status(500).json({
    success: false,
    message: "Error interno del servidor",
  });
});

// Conexion con la base de datos
prisma.$connect()
  .then(() => console.log("Conexión con PostgreSQL exitosa"))
  .catch((error) => console.error("Error de conexión:", error.message));

const server = createServer(app);
iniciarWebSocketPedidos(server, origenesPermitidos);

// Escuchar en todas las interfaces de red
server.listen(PORT, "0.0.0.0", () => {
  console.log("-----------------------------------");
  console.log(`Servicio: ${SERVICE_NAME}`);
  console.log(`Puerto: ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log("-----------------------------------");
});