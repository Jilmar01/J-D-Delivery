import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";
import { enviarMensajeTcp } from "../services/tcp.js";

const router = Router();

const ESTADOS = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
];

// CONFIRMED significa "asignado a un repartidor": el enum de orders no tiene ASSIGNED
// (ese estado vive en deliveries). Por eso se permite pasar de CONFIRMED a IN_TRANSIT.
const TRANSICIONES = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "IN_TRANSIT", "CANCELLED"],
  PREPARING: ["IN_TRANSIT", "CANCELLED"],
  IN_TRANSIT: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

const esLatitud = (v) => typeof v === "number" && Number.isFinite(v) && v >= -90 && v <= 90;
const esLongitud = (v) => typeof v === "number" && Number.isFinite(v) && v >= -180 && v <= 180;

// Punto de salida (el local): desde él se elige al repartidor más cercano
function puntoDeSalida() {
  const lat = Number(process.env.PICKUP_LAT);
  const lng = Number(process.env.PICKUP_LNG);
  if (process.env.PICKUP_LAT === undefined || process.env.PICKUP_LNG === undefined) return null;
  return esLatitud(lat) && esLongitud(lng) ? { lat, lng } : null;
}

// Aviso al servidor TCP de concurrencia para que ofrezca el pedido a los repartidores
// más cercanos. Si falla, el pedido ya está creado: se informa pero no se deshace.
async function ofrecerPedido(order) {
  const salida = puntoDeSalida();
  if (!salida) return { enviada: false, motivo: "PICKUP_LAT/PICKUP_LNG no configurados" };

  try {
    const respuesta = await enviarMensajeTcp({
      tipo: "NUEVO_PEDIDO",
      pedidoId: order.id,
      lat: salida.lat,
      lng: salida.lng,
      direccion: order.deliveryAddress,
      ...(order.deliveryLat !== null && {
        entregaLat: Number(order.deliveryLat),
        entregaLng: Number(order.deliveryLng),
      }),
    });
    return { enviada: respuesta.tipo === "OFERTA_ENVIADA", respuesta };
  } catch (error) {
    console.error("No se pudo avisar al servidor TCP:", error.message);
    return { enviada: false, motivo: "Servidor TCP no disponible" };
  }
}

// POST /api/orders - Crear pedido
router.post("/", async (req, res) => {
  try {
    const { customerId, deliveryAddress, notes, total, items, deliveryLat, deliveryLng } =
      req.body;

    if (
      typeof customerId !== "string" ||
      !customerId.trim() ||
      typeof deliveryAddress !== "string" ||
      !deliveryAddress.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "customerId y deliveryAddress son obligatorios",
      });
    }

    // El total es opcional: sin productos todavía se registra en 0
    const totalNumber = total === undefined || total === null || total === "" ? 0 : Number(total);

    if (!Number.isFinite(totalNumber) || totalNumber < 0) {
      return res.status(400).json({
        success: false,
        message: "El total debe ser un número mayor o igual que cero",
      });
    }

    if (notes !== undefined && notes !== null && typeof notes !== "string") {
      return res.status(400).json({
        success: false,
        message: "Las notas deben ser un texto",
      });
    }

    // Las coordenadas de entrega van juntas: se guardan en el pedido y se reenvían al
    // servidor TCP, que las incluye en la oferta al repartidor
    const hayCoordenadas = deliveryLat !== undefined || deliveryLng !== undefined;
    if (hayCoordenadas && (!esLatitud(deliveryLat) || !esLongitud(deliveryLng))) {
      return res.status(400).json({
        success: false,
        message: "deliveryLat y deliveryLng deben ser coordenadas numéricas válidas",
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
        ...(hayCoordenadas && {
          deliveryLat: new Prisma.Decimal(deliveryLat.toFixed(6)),
          deliveryLng: new Prisma.Decimal(deliveryLng.toFixed(6)),
        }),
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

    const oferta = await ofrecerPedido(order);

    return res.status(201).json({
      success: true,
      message: "Pedido creado correctamente",
      data: order,
      oferta: { enviada: oferta.enviada, ...(oferta.motivo && { motivo: oferta.motivo }) },
    });
  } catch (error) {
    console.error("Error al crear pedido:", error);

    return res.status(500).json({
      success: false,
      message: "Error interno al crear el pedido",
    });
  }
});

// GET /api/orders - Consultar pedidos (filtros opcionales: ?status=PENDING&customerId=...)
router.get("/", async (req, res) => {
  try {
    const { status, customerId } = req.query;

    if (status !== undefined && !ESTADOS.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status debe ser uno de: ${ESTADOS.join(", ")}`,
      });
    }

    const orders = await prisma.order.findMany({
      where: {
        ...(status && { status }),
        ...(typeof customerId === "string" && customerId && { customerId }),
      },
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

// GET /api/orders/:id - Consultar un pedido por ID
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "El ID del pedido debe ser un entero positivo",
      });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado",
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Error al consultar pedido:", error);

    return res.status(500).json({
      success: false,
      message: "Error interno al consultar el pedido",
    });
  }
});

// POST /api/orders/:id/assign - Un repartidor toma el pedido { courierId }
// La asignación atómica la hace el servidor TCP (concurrency-tcp-service) en PostgreSQL.
router.post("/:id/assign", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const courierId = req.body?.courierId;

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "El ID del pedido debe ser un entero positivo",
      });
    }

    if (!Number.isSafeInteger(courierId) || courierId <= 0) {
      return res.status(400).json({
        success: false,
        message: "courierId debe ser un entero positivo",
      });
    }

    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado",
      });
    }

    if (order.status !== "PENDING") {
      return res.status(409).json({
        success: false,
        message: `El pedido ya no está disponible (estado ${order.status})`,
      });
    }

    let respuesta;
    try {
      respuesta = await enviarMensajeTcp({
        tipo: "ASIGNAR_PEDIDO",
        pedidoId: id,
        repartidorId: courierId,
        direccion: order.deliveryAddress,
      });
    } catch (error) {
      console.error("Error al contactar el servidor TCP:", error.message);
      return res.status(503).json({
        success: false,
        message: "El servicio de asignación no está disponible",
      });
    }

    if (respuesta.tipo !== "ASIGNACION_OK") {
      return res.status(409).json({
        success: false,
        message: "El pedido ya fue asignado a otro repartidor",
        motivo: respuesta.motivo,
      });
    }

    // Asignado: el pedido pasa a CONFIRMED (solo si seguía PENDING)
    await prisma.order.updateMany({
      where: { id, status: "PENDING" },
      data: { status: "CONFIRMED" },
    });

    return res.status(200).json({
      success: true,
      message: "Pedido asignado correctamente",
      data: { orderId: id, courierId, status: "CONFIRMED" },
    });
  } catch (error) {
    console.error("Error al asignar pedido:", error);

    return res.status(500).json({
      success: false,
      message: "Error interno al asignar el pedido",
    });
  }
});

// PATCH /api/orders/:id/status  (también /estado) { status }
async function actualizarEstado(req, res) {
  try {
    const id = Number(req.params.id);
    const status = req.body?.status ?? req.body?.estado;

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "El ID debe ser un número entero positivo",
      });
    }

    if (typeof status !== "string" || !ESTADOS.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "El estado proporcionado no es válido",
      });
    }

    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado",
      });
    }

    if (!TRANSICIONES[order.status].includes(status)) {
      return res.status(409).json({
        success: false,
        message: `No se permite cambiar de ${order.status} a ${status}`,
      });
    }

    const actualizado = await prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true },
    });

    return res.status(200).json({
      success: true,
      message: "Estado del pedido actualizado correctamente",
      data: actualizado,
    });
  } catch (error) {
    console.error("Error al actualizar estado:", error);

    return res.status(500).json({
      success: false,
      message: "Error interno al actualizar el estado del pedido",
    });
  }
}

router.patch("/:id/status", actualizarEstado);
router.patch("/:id/estado", actualizarEstado);

export default router;
