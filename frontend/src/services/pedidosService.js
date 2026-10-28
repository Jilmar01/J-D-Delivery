
import { permiteTransicionPedido } from '../utils/estados'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const PEDIDOS_URL = `${API_URL}/api/orders`

/**
 * Servicio de pedidos.
 * Con backend (por defecto) habla con order-service. En modo demostración
 * (`{ demo: true }`, cuando no hay autenticación real) usa datos simulados en memoria.
 */

// Estados de la base (orders) <-> estados de la interfaz.
// CONFIRMED equivale a "asignado a un repartidor" (el enum de orders no tiene ASSIGNED).
const ESTADO_INTERFAZ = {
  PENDING: 'PENDIENTE',
  CONFIRMED: 'ASIGNADO',
  PREPARING: 'ASIGNADO',
  IN_TRANSIT: 'EN_CAMINO',
  DELIVERED: 'ENTREGADO',
  CANCELLED: 'CANCELADO',
}

const ESTADO_API = {
  PENDIENTE: 'PENDING',
  ASIGNADO: 'CONFIRMED',
  EN_CAMINO: 'IN_TRANSIT',
  ENTREGADO: 'DELIVERED',
  CANCELADO: 'CANCELLED',
}

function aPedidoInterfaz(orden) {
  return {
    id: orden.id,
    cliente: orden.customerId,
    direccion: orden.deliveryAddress,
    descripcion: orden.notes || '',
    estado: ESTADO_INTERFAZ[orden.status] || orden.status,
    fecha: new Date(orden.createdAt).toLocaleDateString('es-EC'),
    total: Number(orden.total),
    lat: orden.deliveryLat === null ? null : Number(orden.deliveryLat),
    lng: orden.deliveryLng === null ? null : Number(orden.deliveryLng),
  }
}

async function solicitar(url, opciones) {
  let respuesta

  try {
    respuesta = await fetch(url, {
      ...opciones,
      headers: { 'Content-Type': 'application/json', ...opciones?.headers },
    })
  } catch (error) {
    throw new Error(
      'No se pudo conectar con el servicio de pedidos. Verifica que esté activo.',
      { cause: error }
    )
  }

  let datos = {}
  try {
    datos = await respuesta.json()
  } catch {
    // Sin cuerpo JSON: se usa el mensaje por defecto
  }

  if (!respuesta.ok) {
    throw new Error(datos.message || `Error del servicio de pedidos (HTTP ${respuesta.status}).`)
  }

  return datos
}

const pedidosSimulados = []
const propietariosPedidosSimulados = new Map()

export async function obtenerPedidos({ demo = false } = {}) {
  if (demo) return [...pedidosSimulados]

  const { data } = await solicitar(PEDIDOS_URL)
  return data.map(aPedidoInterfaz)
}

export async function obtenerPedidosCliente(correo, { demo = false } = {}) {
  const propietario = correo?.trim().toLowerCase()
  if (!propietario) return []

  if (demo) {
    return pedidosSimulados.filter(
      (pedido) =>
        propietariosPedidosSimulados.get(pedido.id) === propietario
    )
  }

  const { data } = await solicitar(
    `${PEDIDOS_URL}?customerId=${encodeURIComponent(correo.trim())}`
  )
  return data.map(aPedidoInterfaz)
}

/**
 * datosPedido: { cliente, direccion, descripcion, lat, lng }
 * lat/lng son el punto de entrega confirmado en el mapa.
 */
export async function crearPedido(datosPedido, correoCliente, { demo = false } = {}) {
  if (demo) {
    const nuevoPedido = {
      id: Date.now(),
      ...datosPedido,
      estado: 'PENDIENTE',
      fecha: new Date().toLocaleDateString('es-EC'),
    }

    pedidosSimulados.push(nuevoPedido)
    if (correoCliente) {
      propietariosPedidosSimulados.set(
        nuevoPedido.id,
        correoCliente.trim().toLowerCase()
      )
    }

    return nuevoPedido
  }

  const { data } = await solicitar(PEDIDOS_URL, {
    method: 'POST',
    body: JSON.stringify({
      customerId: correoCliente.trim(),
      deliveryAddress: datosPedido.direccion,
      notes: datosPedido.descripcion,
      deliveryLat: datosPedido.lat,
      deliveryLng: datosPedido.lng,
    }),
  })

  return { ...aPedidoInterfaz(data), cliente: datosPedido.cliente }
}

/**
 * Avanza el estado de un pedido. Pasar de PENDIENTE a ASIGNADO es la asignación
 * concurrente: solo un repartidor la obtiene (necesita `courierId`).
 */
export async function actualizarEstadoPedido(id, estado, { demo = false, courierId } = {}) {
  if (demo) {
    const pedido = pedidosSimulados.find((p) => p.id === id)

    if (!pedido) {
      throw new Error('Pedido no encontrado.')
    }

    if (!permiteTransicionPedido(pedido.estado, estado)) {
      throw new Error(
        `Transición de estado no permitida: ${pedido.estado} → ${estado}.`
      )
    }

    pedido.estado = estado

    return { ...pedido }
  }

  if (estado === 'ASIGNADO') {
    if (!Number.isSafeInteger(courierId) || courierId <= 0) {
      throw new Error('No se pudo identificar al repartidor.')
    }

    await solicitar(`${PEDIDOS_URL}/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ courierId }),
    })

    const { data } = await solicitar(`${PEDIDOS_URL}/${id}`)
    return aPedidoInterfaz(data)
  }

  const { data } = await solicitar(`${PEDIDOS_URL}/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: ESTADO_API[estado] }),
  })

  return aPedidoInterfaz(data)
}

export { API_URL }
