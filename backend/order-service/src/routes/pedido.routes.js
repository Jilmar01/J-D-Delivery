import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";

const router = Router();

// POST /api/pedidos
router.post("/", async (req, res) => {
  try {
    const { clienteId, descripcion, total } = req.body;

    // Validar datos obligatorios
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

    // Validar el total
    const totalNumero = Number(total);

    if (
      !Number.isFinite(totalNumero) ||
      totalNumero <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "El total debe ser un número mayor que cero",
      });
    }

    // Validar la descripción
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

    // Crear el pedido en PostgreSQL mediante Prisma
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
    console.error("Error al crear el pedido:", error);

    return res.status(500).json({
      success: false,
      message: "Error interno al crear el pedido",
    });
  }
});

export default router;