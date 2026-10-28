import { Router } from "express";

import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getOrdersByStatus
} from "../controllers/order.controller.js";

const router = Router();

// Endpoint /api/orders

// Crear un pedido
router.post("/", createOrder);

// Consultar todos los pedidos
router.get("/", getAllOrders);

// Consultar pedidos por estado
router.get("/status", getOrdersByStatus);

// Consultar un pedido por ID
router.get("/:id", getOrderById);

// Actualizar el estado de un pedido
router.patch("/:id/status", updateOrderStatus);

export default router;
