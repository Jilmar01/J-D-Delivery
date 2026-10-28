import net from 'net';
import { prisma } from "../config/database.js";
import { HttpError } from "../utils/HttpError.js";
import { Socket } from 'dgram';

const VALID_STATUSES = [
  "PENDING",
  "ASSIGNED",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
];

const STATUS_TRANSITIONS = {
  PENDING: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["IN_TRANSIT", "CANCELLED"],
  IN_TRANSIT: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

function validatePositiveInteger(value, fieldName) {
  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    throw new HttpError(`${fieldName} debe ser un entero positivo`, 400);
  }

  return number;
}

// Crear entrega
export async function createDelivery(data) {
  const orderId = validatePositiveInteger(data.orderId, "orderId");

  if (
    typeof data.deliveryAddress !== "string" ||
    !data.deliveryAddress.trim()
  ) {
    throw new Error("La dirección de entrega es obligatoria");
  }

  const deliveryLat = Number(data.deliveryLat);
  const deliveryLng = Number(data.deliveryLng);

  if (
    !Number.isFinite(deliveryLat) ||
    deliveryLat < -90 ||
    deliveryLat > 90
  ) {
    throw new Error("La latitud debe estar entre -90 y 90");
  }

  if (
    !Number.isFinite(deliveryLng) ||
    deliveryLng < -180 ||
    deliveryLng > 180
  ) {
    throw new Error("La longitud debe estar entre -180 y 180");
  }

  return prisma.$transaction(async (tx) => {
    const existingDelivery = await tx.delivery.findFirst({
      where: { orderId },
    });

    if (existingDelivery) {
      const error = new Error("Este pedido ya tiene una entrega registrada");
      error.statusCode = 409;
      throw error;
    }

    return tx.delivery.create({
      data: {
        orderId,
        courierId: null,
        deliveryAddress: data.deliveryAddress.trim(),
        deliveryLat,
        deliveryLng,
        status: "PENDING",
        history: {
          create: {
            newStatus: "PENDING",
            notes: "Entrega creada",
          },
        },
      },
      include: {
        history: true,
      },
    });
  });
}

// Consultar todas las entregas
export async function getAllDeliveries() {
  return prisma.delivery.findMany({
    include: {
      history: {
        orderBy: { date: "asc" },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

// Consultar una entrega por ID
export async function getDeliveryById(id) {
  const deliveryId = validatePositiveInteger(id, "id");

  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: {
      history: {
        orderBy: { date: "asc" },
      },
    },
  });

  if (!delivery) {
    const error = new Error("Entrega no encontrada");
    error.statusCode = 404;
    throw error;
  }

  return delivery;
}

// Asignar o reasignar repartidor
export async function assignCourier(id, courierId) {
  const deliveryId = validatePositiveInteger(id, "id");
  const newCourierId = validatePositiveInteger(courierId, "courierId");

  return prisma.$transaction(async (tx) => {
    const delivery = await tx.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      const error = new Error("Entrega no encontrada");
      error.statusCode = 404;
      throw error;
    }

    if (["DELIVERED", "CANCELLED", "IN_TRANSIT"].includes(delivery.status)) {
      const error = new Error(
        "No se puede cambiar el repartidor en el estado actual"
      );
      error.statusCode = 409;
      throw error;
    }

    const updatedDelivery = await tx.delivery.update({
      where: { id: deliveryId },
      data: {
        courierId: newCourierId,
        status: "ASSIGNED",
        assignedAt: new Date(),
        history: {
          create: {
            previousStatus: delivery.status,
            newStatus: "ASSIGNED",
            notes: `Entrega asignada al repartidor ${newCourierId}`,
          },
        },
      },
      include: { history: true },
    });

    return updatedDelivery;
  });
}

// Cambiar estado de entrega
export async function updateDeliveryStatus(id, newStatus, notes) {
  const deliveryId = validatePositiveInteger(id, "id");

  if (typeof newStatus !== "string" || !VALID_STATUSES.includes(newStatus)) {
    throw new Error("El estado de entrega no es válido");
  }

  if (notes !== undefined && notes !== null && typeof notes !== "string") {
    throw new Error("Las notas deben ser un texto");
  }

  return prisma.$transaction(async (tx) => {
    const delivery = await tx.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      const error = new Error("Entrega no encontrada");
      error.statusCode = 404;
      throw error;
    }

    if (delivery.status === newStatus) {
      const error = new Error("La entrega ya tiene ese estado");
      error.statusCode = 409;
      throw error;
    }

    if (!STATUS_TRANSITIONS[delivery.status].includes(newStatus)) {
      const error = new Error(
        `No se permite cambiar de ${delivery.status} a ${newStatus}`
      );
      error.statusCode = 409;
      throw error;
    }

    const now = new Date();

    const timestamps = {};

    if (newStatus === "IN_TRANSIT") {
      timestamps.startedAt = now;
    }

    if (newStatus === "DELIVERED") {
      timestamps.deliveredAt = now;
    }

    return tx.delivery.update({
      where: { id: deliveryId },
      data: {
        status: newStatus,
        ...timestamps,
        history: {
          create: {
            previousStatus: delivery.status,
            newStatus,
            notes: notes?.trim() || null,
          },
        },
      },
      include: { history: true },
    });
  });
}

// Consultar entregas por repartidor
export async function getDeliveriesByCourier(courierId) {
  const id = validatePositiveInteger(courierId, "courierId");

  return prisma.delivery.findMany({
    where: { courierId: id },
    include: { history: true },
    orderBy: { createdAt: "desc" },
  });
}

// Consultar entrega por pedido
export async function getDeliveryByOrder(orderId) {
  const id = validatePositiveInteger(orderId, "orderId");

  const delivery = await prisma.delivery.findFirst({
    where: { orderId: id },
    include: {
      history: {
        orderBy: { date: "asc" },
      },
    },
  });

  if (!delivery) {
    const error = new Error("No existe una entrega para este pedido");
    error.statusCode = 404;
    throw error;
  }

  return delivery;
}

// Consultar historial
export async function getDeliveryHistory(id) {
  const deliveryId = validatePositiveInteger(id, "id");

  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    select: { id: true },
  });

  if (!delivery) {
    const error = new Error("Entrega no encontrada");
    error.statusCode = 404;
    throw error;
  }

  return prisma.deliveryHistory.findMany({
    where: { deliveryId },
    orderBy: { date: "asc" },
  });
}

// Comunicacion con el servidor TCP
const connectAndFindCourier = (deliveryId, orderId, courierId) => {
  const TCP_PORT = Number(process.env.TCP_PORT) || 12345;
  const TCP_HOST = process.env.TCP_HOST || '127.0.0.1';

  const client = new net.Socket();

  // 1. Conectarse al servidor TCP
  client.connect(TCP_PORT, TCP_HOST, () => {
    console.log(`🔌 Cliente conectado al servidor TCP (${TCP_HOST}:${TCP_PORT})`);

    // 2. Construir el payload según la estructura que espera tu servidor TCP
    const payload = {
      tipo: 'ASIGNAR_PEDIDO',
      pedidoId: orderId,
      repartidorId: courierId,
      deliveryId: deliveryId
    };

    // 3. Enviar los datos convertidos a String Y CON EL \n AL FINAL
    client.write(JSON.stringify(payload) + '\n');
  });

  // 4. Escuchar la respuesta devuelta por el servidor TCP
  client.on('data', (data) => {
    const respuesta = data.toString().trim();
    console.log('📩 Respuesta del servidor TCP:', respuesta);

    // Opcional: Cerrar la conexión una vez recibida la respuesta
    client.end();
  });

  // 5. Manejo de errores para evitar que la aplicación se caiga
  client.on('error', (err) => {
    console.error('❌ Error en la conexión TCP:', err.message);
  });

  client.on('close', () => {
    console.log('🔌 Conexión TCP cerrada');
  });
};

connectAndFindCourier(1, 3);