import { Router } from "express";

import {
  createDelivery,
  getAllDeliveries,
  getDeliveryById,
  assignCourier,
  updateDeliveryStatus,
  getDeliveriesByCourier,
  getDeliveryByOrder,
  getDeliveryHistory,
} from "../controllers/delivery.controller.js";

const router = Router();

// Endpint /api/deliveries

// Crear una entrega
router.post("/", createDelivery);

// Consultar todas las entregas
router.get("/", getAllDeliveries);

// Consultar entregas de un repartidor
router.get("/courier/:courierId", getDeliveriesByCourier);

// Consultar entrega de un pedido
router.get("/order/:orderId", getDeliveryByOrder);

// 	Consultar el historial de una entrega
router.get("/:id/history", getDeliveryHistory);

// Asignar un repartidor
router.patch("/:id/assign", assignCourier);

// Cambiar el estado de una entrega
router.patch("/:id/status", updateDeliveryStatus);

// Consultar una entrega y su historial
router.get("/:id", getDeliveryById);

export default router;