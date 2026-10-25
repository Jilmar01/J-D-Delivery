import { Router } from "express";

const router = Router();

// POST /api/pedidos
router.post("/", (req, res) => {
  res.status(501).json({
    message: "Creación de pedidos pendiente de implementación",
  });
});

// GET /api/pedidos
router.get("/", (req, res) => {
  res.status(501).json({
    message: "Listado de pedidos pendiente de implementación",
  });
});

// GET /api/pedidos/:id
router.get("/:id", (req, res) => {
  res.status(501).json({
    message: "Consulta de pedido pendiente de implementación",
    id: req.params.id,
  });
});

// PATCH /api/pedidos/:id/estado
router.patch("/:id/estado", (req, res) => {
  res.status(501).json({
    message: "Actualización del estado pendiente de implementación",
    id: req.params.id,
  });
});

export default router;