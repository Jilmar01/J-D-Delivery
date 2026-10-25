import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";

const router = Router();

// POST /api/pedidos - Crear pedido
router.post("/", async (req, res) => {
  try {
    const { clienteId, descripcion, total } = req.body;

    if (
      typeof clienteId !== "string" ||
      !clienteId.trim() ||
      total === undefined ||
      total === null ||
      total === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "clienteId y total son obligatorios",
      });
    }

    const totalNumero = Number(total);

    if (!Number.isFinite(totalNumero) || totalNumero <= 0) {
      return res.status(400).json({
        success: false,
        message: "El total debe ser un número mayor que cero",
      });
    }

    if (
      descripcion !== undefined &&
      descripcion !== null &&
      typeof descripcion !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "La descripción debe ser un texto",
      });
    }

    const pedido = await prisma.pedido.create({
      data: {
        clienteId: clienteId.trim(),
        descripcion: descripcion?.trim() || null,
        total: new Prisma.Decimal(totalNumero.toFixed(2)),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Pedido creado correctamente",
      data: pedido,
    });
  } catch (error) {
    console.error("Error al crear pedido:", error);

    return res.status(500).json({
      success: false,
      message: "Error interno al crear el pedido",
    });
  }
});

// GET /api/pedidos - Consultar todos los pedidos
router.get("/", async (req, res) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      total: pedidos.length,
      data: pedidos,
    });
  } catch (error) {
    console.error("Error al consultar pedidos:", error);

    return res.status(500).json({
      success: false,
      message: "Error interno al consultar los pedidos",
    });
  }
});

// GET /api/pedidos/:id - Consultar un pedido por ID
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "El ID del pedido debe ser un entero positivo",
      });
    }

    const pedido = await prisma.pedido.findUnique({
      where: { id },
    });

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado",
      });
    }

    return res.status(200).json({
      success: true,
      data: pedido,
    });
  } catch (error) {
    console.error("Error al consultar pedido:", error);

    return res.status(500).json({
      success: false,
      message: "Error interno al consultar el pedido",
    });
  }
});

// PATCH /api/pedidos/:id/estado
router.patch("/:id/estado", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { estado } = req.body;

    // Validar ID
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "El ID debe ser un número entero positivo",
      });
    }

    // Validar estado
    const transiciones = {
      PENDIENTE: ["CONFIRMADO", "CANCELADO"],
      CONFIRMADO: ["EN_PREPARACION", "CANCELADO"],
      EN_PREPARACION: ["EN_CAMINO", "CANCELADO"],
      EN_CAMINO: ["ENTREGADO"],
      ENTREGADO: [],
      CANCELADO: [],
    };

    if (
      typeof estado !== "string" ||
      !Object.prototype.hasOwnProperty.call(transiciones, estado)
    ) {
      return res.status(400).json({
        success: false,
        message: "El estado proporcionado no es válido",
      });
    }

    // Buscar pedido
    const pedido = await prisma.pedido.findUnique({
      where: { id },
    });

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado",
      });
    }

    // Validar transición
    if (!transiciones[pedido.estado].includes(estado)) {
      return res.status(409).json({
        success: false,
        message: `No se permite cambiar de ${pedido.estado} a ${estado}`,
      });
    }

    // Actualizar estado
    const pedidoActualizado = await prisma.pedido.update({
      where: { id },
      data: { estado },
    });

    return res.status(200).json({
      success: true,
      message: "Estado del pedido actualizado correctamente",
      data: pedidoActualizado,
    });
  } catch (error) {
    console.error("Error al actualizar estado:", error);

    return res.status(500).json({
      success: false,
      message: "Error interno al actualizar el estado del pedido",
    });
  }
});

export default router;