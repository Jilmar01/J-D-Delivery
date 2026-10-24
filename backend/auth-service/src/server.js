import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT) || 3003;
const SERVICE_NAME = process.env.SERVICE_NAME || "auth-service";

// Middlewares globales
app.use(express.json());

// Ruta principal
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    service: SERVICE_NAME,
    message: "Microservicio de autenticacion funcionando",
  });
});

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

// Escuchar en todas las interfaces de red
app.listen(PORT, "0.0.0.0", () => {
  console.log("-----------------------------------");
  console.log(`Servicio: ${SERVICE_NAME}`);
  console.log(`Puerto: ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log("-----------------------------------");
});