
const API_URL = import.meta.env.DEV
  ? ''
  : (
      import.meta.env.URL_PEDIDOS ||
      import.meta.env.VITE_API_URL ||
      'http://localhost:3001'
    ).replace(/\/$/, '')
//
const WS_URL =
  import.meta.env.VITE_WS_URL ||
  (import.meta.env.DEV
    ? '/ws'
    : `${API_URL.replace(/^http/, 'ws')}/ws`)

/**
 * Las vistas de cliente y repartidor conservan sus datos simulados.
 * El panel administrativo usa los métodos REST de abajo.
 */

const pedidosSimulados = []

export async function obtenerPedidos() {
  // Simula una respuesta del servicio mientras se prepara la API real.
  return [...pedidosSimulados]
}

export async function crearPedido(datosPedido) {
  // Simula la creación de un pedido.
  const nuevoPedido = {
    id: Date.now(),
    ...datosPedido,
    estado: 'PENDIENTE',
    fecha: new Date().toLocaleDateString('es-EC'),
  }

  pedidosSimulados.push(nuevoPedido)

  return nuevoPedido
}

export async function actualizarEstadoPedido(id, estado) {
  const pedido = pedidosSimulados.find((p) => p.id === id)

  if (!pedido) {
    throw new Error('Pedido no encontrado.')
  }

  pedido.estado = estado

  return { ...pedido }
}

function normalizarPedidoAdministrativo(pedido) {
  const id = Number(pedido?.id)
  const estados = {
    PENDING: 'PENDIENTE',
    CONFIRMED: 'CONFIRMADO',
    PREPARING: 'EN_PREPARACION',
    IN_DELIVERY: 'EN_CAMINO',
    DELIVERED: 'ENTREGADO',
    CANCELLED: 'CANCELADO',
  }
  const estadoOriginal = pedido?.estado || pedido?.status

  if (!pedido || typeof pedido !== 'object' || !Number.isSafeInteger(id)) {
    throw new Error('El servidor devolvió un pedido con formato no válido.')
  }

  return {
    ...pedido,
    id,
    estado:
      estados[String(estadoOriginal).toUpperCase()] ||
      String(estadoOriginal || 'PENDIENTE').toUpperCase(),
    cliente:
      pedido.clienteId ||
      pedido.customerId ||
      pedido.cliente ||
      `Cliente ${pedido.id}`,
    repartidor: pedido.repartidorId
      ? `Repartidor ${pedido.repartidorId}`
      : 'Sin asignar',
    fecha: pedido.createdAt || pedido.fecha
      ? new Date(pedido.createdAt || pedido.fecha).toLocaleString('es-EC')
      : '—',
  }
}

async function solicitarPedidos(ruta, token, opciones = {}) {
  if (!token) {
    throw new Error('La sesión administrativa expiró. Inicia sesión nuevamente.')
  }

  const respuesta = await fetch(`${API_URL}${ruta}`, {
    ...opciones,
    headers: {
      ...opciones.headers,
      Authorization: `Bearer ${token}`,
    },
  })
  const datos = await respuesta.json().catch(() => null)

  if (!respuesta.ok) {
    throw new Error(
      datos?.message || `La API de pedidos respondió con ${respuesta.status}.`
    )
  }

  return datos
}

async function obtenerPaginaPedidos(ruta, token, offset, limite) {
  const separador = ruta.includes('?') ? '&' : '?'
  const respuesta = await fetch(
    `${API_URL}${ruta}${separador}limit=${limite}&offset=${offset}`,
    token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined
  )
  const datos = await respuesta.json().catch(() => null)

  if (!respuesta.ok) {
    throw new Error(
      datos?.message || `La API de pedidos respondió con ${respuesta.status}.`
    )
  }

  if (!Array.isArray(datos?.data)) {
    throw new Error('La API no devolvió una lista válida de pedidos.')
  }

  const total = Number.isSafeInteger(Number(datos.total))
    ? Number(datos.total)
    : null
  const respuestaYaPaginada =
    datos.offset !== undefined &&
    datos.limit !== undefined &&
    Number(datos.offset) === offset &&
    Number(datos.limit) === limite
  const respuestaCompleta =
    total !== null && total === datos.data.length
  const respuestaPaginada =
    respuestaYaPaginada
      ? datos.data
      : respuestaCompleta || datos.data.length > limite
        ? datos.data.slice(offset, offset + limite)
        : datos.data

  return {
    data: respuestaPaginada.map(normalizarPedidoAdministrativo),
    total,
  }
}

export async function obtenerPaginaPedidosAdministrativos(
  token,
  offset,
  limite
) {
  if (!token) {
    throw new Error('La sesión administrativa expiró. Inicia sesión nuevamente.')
  }

  const pagina = await obtenerPaginaPedidos(
    '/api/orders',
    token,
    offset,
    limite
  )

  return pagina
}

export async function obtenerPaginaPedidosParaVistaPrevia(offset, limite) {
  return obtenerPaginaPedidos('/api/orders', undefined, offset, limite)
}

export async function cambiarEstadoAdministrativo(id, estado, token) {
  const respuesta = await solicitarPedidos(
    `/api/orders/${id}/estado`,
    token,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ estado }),
    },
  )

  if (!respuesta?.data) {
    throw new Error('La API no devolvió el pedido actualizado.')
  }

  return normalizarPedidoAdministrativo(respuesta.data)
}

export function normalizarEventoPedido(pedido) {
  return normalizarPedidoAdministrativo(pedido)
}

export { API_URL, WS_URL }
