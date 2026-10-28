import { Prisma } from "@prisma/client";
import { prisma } from "../config/database.js";
import axios from "axios";

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

const transiciones = {
  PENDIENTE: ["CONFIRMADO", "CANCELADO"],
  CONFIRMADO: ["EN_PREPARACION", "CANCELADO"],
  EN_PREPARACION: ["EN_CAMINO", "CANCELADO"],
  EN_CAMINO: ["ENTREGADO"],
  ENTREGADO: [],
  CANCELADO: [],
};

const validarId = (id) => {
  const numero = Number(id);

  if (!Number.isSafeInteger(numero) || numero <= 0) {
    throw new AppError(
      "El ID del pedido debe ser un entero positivo",
      400
    );
  }

  return numero;
};

const validarItems = (items) => {
  if (items !== undefined && !Array.isArray(items)) {
    throw new AppError(
      "Los productos deben enviarse en un arreglo",
      400
    );
  }

  const orderItems = items ?? [];

  for (const item of orderItems) {
    if (
      !item ||
      !Number.isSafeInteger(item.productId) ||
      item.productId <= 0 ||
      typeof item.productName !== "string" ||
      !item.productName.trim() ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity <= 0 ||
      item.unitPrice === undefined ||
      item.unitPrice === null ||
      item.unitPrice === ""
    ) {
      throw new AppError(
        "Uno o más productos tienen datos inválidos",
        400
      );
    }

    const unitPrice = Number(item.unitPrice);

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new AppError(
        "El precio unitario debe ser mayor que cero",
        400
      );
    }
  }

  return orderItems;
};

export const createOrder = async (orderData) => {
  const {
    customerId,
    deliveryAddress,
    deliveryLat,
    deliveryLng,
    notes,
    total,
    items,
  } = orderData;

  console.log(orderData);
  
  if (
    typeof customerId !== "string" ||
    !customerId.trim() ||
    typeof deliveryAddress !== "string" ||
    !deliveryAddress.trim() ||
    deliveryLat === undefined ||
    deliveryLng === undefined ||
    total === undefined ||
    total === null ||
    total === ""
  ) {
    throw new AppError(
      "customerId, deliveryAddress, deliveryLat, deliveryLng y total son obligatorios",
      400
    );
  }

  const lat = Number(deliveryLat);
  const lng = Number(deliveryLng);
  const totalNumber = Number(total);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new AppError("La latitud debe estar entre -90 y 90", 400);
  }

  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    throw new AppError("La longitud debe estar entre -180 y 180", 400);
  }

  if (!Number.isFinite(totalNumber) || totalNumber <= 0) {
    throw new AppError("El total debe ser mayor que cero", 400);
  }

  if (notes !== undefined && notes !== null && typeof notes !== "string") {
    throw new AppError("Las notas deben ser un texto", 400);
  }

  const orderItems = validarItems(items);

  const calculatedTotal = orderItems.reduce((sum, item) => {
    return sum + Math.round(Number(item.unitPrice) * 100) * item.quantity;
  }, 0);

  const receivedTotal = Math.round(totalNumber * 100);

  if (
    orderItems.length > 0 &&
    Math.abs(calculatedTotal - receivedTotal) > 1
  ) {
    throw new AppError(
      "El total no coincide con la suma de los productos",
      400
    );
  }

  // 1. Crear el pedido
  let order;

  try {
    order = await prisma.order.create({
      data: {
        customerId: customerId.trim(),
        deliveryAddress: deliveryAddress.trim(),
        deliveryLat: lat,
        deliveryLng: lng,
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
                (
                  Math.round(unitPrice * 100) *
                  item.quantity /
                  100
                ).toFixed(2)
              ),
            };
          }),
        },
      },
      include: {
        items: true,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        throw new AppError(
          "El cliente o alguno de los productos no existe",
          400
        );
      }
    }

    throw error;
  }

  // 2. Solicitar la creación de la entrega
  const deliveryServiceUrl = process.env.DELIVERY_SERVICE_URL;

  if (!deliveryServiceUrl) {
    return {
      ...order,
      delivery: {
        success: false,
        message: "Pedido creado, pero Delivery no está configurado",
      },
    };
  }

  try {
    
    const response = await axios.post(
      `${deliveryServiceUrl}/api/deliveries`,
      {
        orderId: order.id,
        deliveryAddress: order.deliveryAddress,
        deliveryLat: order.deliveryLat,
        deliveryLng: order.deliveryLng,
      },
      {
        timeout: 5000,
      }
    );

    return {
      ...order,
      delivery: response.data.data,
    };
  } catch (error) {
    console.error(
      "Pedido creado, pero no se pudo crear la entrega:",
      error.response?.data || error.message
    );

    return {
      ...order,
      delivery: {
        success: false,
        message: "Pedido creado, pero la entrega está pendiente de asignación",
      },
    };
  }
};

export const getAllOrders = async (filters = {}) => {
  const where = {};

  if (filters.status !== undefined) {
    const estadosValidos = [
      "PENDIENTE",
      "CONFIRMADO",
      "EN_PREPARACION",
      "EN_CAMINO",
      "ENTREGADO",
      "CANCELADO",
    ];

    if (
      typeof filters.status !== "string" ||
      !estadosValidos.includes(filters.status.toUpperCase())
    ) {
      throw new AppError("El estado proporcionado no es válido", 400);
    }

    where.estado = filters.status.toUpperCase();
  }

  return prisma.order.findMany({
    where,
    include: {
      items: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getOrderById = async (idParam) => {
  const id = validarId(idParam);

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
    },
  });

  if (!order) {
    throw new AppError("Pedido no encontrado", 404);
  }

  return order;
};

export const updateOrderStatus = async (idParam, estado) => {
  const id = validarId(idParam);

  if (
    typeof estado !== "string" ||
    !Object.prototype.hasOwnProperty.call(transiciones, estado)
  ) {
    throw new AppError(
      "El estado proporcionado no es válido",
      400
    );
  }

  return prisma.$transaction(async (tx) => {
    const pedido = await tx.order.findUnique({
      where: { id },
    });

    if (!pedido) {
      throw new AppError("Pedido no encontrado", 404);
    }

    if (!transiciones[pedido.estado]) {
      throw new AppError(
        "El pedido tiene un estado no reconocido",
        500
      );
    }

    if (!transiciones[pedido.estado].includes(estado)) {
      throw new AppError(
        `No se permite cambiar de ${pedido.estado} a ${estado}`,
        409
      );
    }

    return tx.order.update({
      where: { id },
      data: { estado },
      include: {
        items: true,
      },
    });
  });
};

export const getOrdersByStatus = async (status) => {
  const estadosValidos = [
    "PENDIENTE",
    "CONFIRMADO",
    "EN_PREPARACION",
    "EN_CAMINO",
    "ENTREGADO",
    "CANCELADO",
  ];

  if (!status || typeof status !== "string") {
    throw new AppError(
      "El parámetro status es obligatorio",
      400
    );
  }

  const estado = status.toUpperCase();

  if (!estadosValidos.includes(estado)) {
    throw new AppError(
      "El estado proporcionado no es válido",
      400
    );
  }

  return prisma.order.findMany({
    where: {
      estado,
    },
    include: {
      items: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export { AppError };