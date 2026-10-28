import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";

const router = Router();

// POST /api/orders - Crear pedido
router.post("/", async (req, res) => {
  try {
    const { customerId, deliveryAddress, notes, total, items } = req.body;

    if (
      typeof customerId !== "string" ||
      !customerId.trim() ||
      typeof deliveryAddress !== "string" ||
      !deliveryAddress.trim() ||
      total === undefined ||
      total === null ||
      total === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "customerId, deliveryAddress y total son obligatorios",
      });
    }

    const totalNumber = Number(total);

    if (!Number.isFinite(totalNumber) || totalNumber <= 0) {
      return res.status(400).json({
        success: false,
        message: "El total debe ser un número mayor que cero",
      });
    }

    if (notes !== undefined && notes !== null && typeof notes !== "string") {
      return res.status(400).json({
        success: false,
        message: "Las notas deben ser un texto",
      });
    }

    if (items !== undefined && !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: "Los productos deben enviarse en un arreglo",
      });
    }

    const orderItems = items ?? [];

    for (const item of orderItems) {
      if (
        !Number.isInteger(item.productId) ||
        item.productId <= 0 ||
        typeof item.productName !== "string" ||
        !item.productName.trim() ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0 ||
        item.unitPrice === undefined ||
        item.unitPrice === null ||
        item.unitPrice === ""
      ) {
        return res.status(400).json({
          success: false,
          message: "Uno o más productos tienen datos inválidos",
        });
      }

      const unitPrice = Number(item.unitPrice);

      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: "El precio unitario debe ser mayor que cero",
        });
      }
    }

    const calculatedTotal = orderItems.reduce(
      (sum, item) => sum + Number(item.unitPrice) * item.quantity,
      0
    );

    if (
      orderItems.length > 0 &&
      Math.abs(calculatedTotal - totalNumber) > 0.01
    ) {
      return res.status(400).json({
        success: false,
        message: "El total no coincide con la suma de los productos",
      });
    }

    const order = await prisma.order.create({
      data: {
        customerId: customerId.trim(),
        deliveryAddress: deliveryAddress.trim(),
        notes: notes?.trim() || null,
        total: new Prisma.Decimal(totalNumber.toFixed(2)),
        items: {
          create: orderItems.map((item) => {
            const unitPrice = Number(item.unitPrice);

            return {
              productId: item.productId,
              productName: item.productName.trim(),
              quantity: item.quantity,
              unitPrice: new Prisma.Decimal(unitPrice.toFixed(2)),
              subtotal: new Prisma.Decimal(
                (unitPrice * item.quantity).toFixed(2)
              ),
            };
          }),
        },
      },
      include: {
        items: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Pedido creado correctamente",
      data: order,
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
    const orders = await prisma.order.findMany({
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      total: orders.length,
      data: orders,
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