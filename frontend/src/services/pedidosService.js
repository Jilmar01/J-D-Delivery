
import { permiteTransicionPedido } from '../utils/estados'

const API_URL = 'https://gph6pj52-3001.use2.devtunnels.ms'
const PEDIDOS_API_URL = `${API_URL.replace(/\/+$/, '')}/api/orders`

const pedidosSimulados = []
const propietariosPedidosSimulados = new Map()

export async function obtenerPedidos() {
  const respuesta = await solicitarPedidos(PEDIDOS_API_URL, {
    method: 'GET',
  })
  const resultado = await leerRespuestaPedidos(respuesta)

  if (!Array.isArray(resultado.data)) {
    throw new Error(
      'El servicio de pedidos devolvió una respuesta inválida: se esperaba una lista en data.'
    )
  }

  return resultado.data
}

export async function obtenerPedidosCliente(customerId) {
  if (typeof customerId !== 'string' || !customerId.trim()) {
    throw new Error(
      'No se pueden consultar los pedidos: falta el customerId real del usuario.'
    )
  }

  const pedidos = await obtenerPedidos()
  return pedidos.filter((pedido) => pedido.customerId === customerId.trim())
}

export async function crearPedido(datosPedido = {}) {
  const customerId = datosPedido.customerId
  const deliveryAddress = datosPedido.deliveryAddress
  const notes = datosPedido.notes ?? ''
  const deliveryLat = Number(datosPedido.deliveryLat)
  const deliveryLng = Number(datosPedido.deliveryLng)
  const total = Number(datosPedido.total)
  const items = datosPedido.items

  if (typeof customerId !== 'string' || !customerId.trim()) {
    throw new Error(
      'No se puede registrar el pedido: falta el identificador real del cliente (customerId).'
    )
  }

  if (typeof deliveryAddress !== 'string' || !deliveryAddress.trim()) {
    throw new Error('No se puede registrar el pedido: falta la dirección de entrega.')
  }

  if (typeof notes !== 'string') {
    throw new Error('No se puede registrar el pedido: las notas deben ser texto.')
  }

  if (
    !Number.isFinite(deliveryLat) ||
    deliveryLat < -90 ||
    deliveryLat > 90 ||
    !Number.isFinite(deliveryLng) ||
    deliveryLng < -180 ||
    deliveryLng > 180
  ) {
    throw new Error(
      'No se puede registrar el pedido: selecciona una ubicación válida con latitud y longitud.'
    )
  }

  if (!Number.isFinite(total) || total <= 0) {
    throw new Error('No se puede registrar el pedido: falta un total válido.')
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error(
      'No se puede registrar el pedido: agrega los productos y sus precios antes de enviarlo.'
    )
  }

  const itemsValidos = items.every(
    (item) =>
      item &&
      item.idLocalDemo === undefined &&
      item.unitPriceDemo === undefined &&
      item.productId !== undefined &&
      !(typeof item.productId === 'string' && item.productId.startsWith('demo-')) &&
      typeof item.productName === 'string' &&
      item.productName.trim() &&
      Number.isInteger(Number(item.quantity)) &&
      Number(item.quantity) > 0 &&
      Number.isFinite(Number(item.unitPrice)) &&
      Number(item.unitPrice) >= 0
  )

  if (!itemsValidos) {
    throw new Error(
      'No se puede registrar el pedido: cada producto debe incluir identificador, nombre, cantidad y precio unitario válidos.'
    )
  }

  const cuerpo = {
    customerId: customerId.trim(),
    deliveryAddress: deliveryAddress.trim(),
    deliveryLat,
    deliveryLng,
    notes,
    total,
    items: items.map((item) => ({
      productId: item.productId,
      productName: item.productName.trim(),
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
    })),
  }

  const respuesta = await solicitarPedidos(PEDIDOS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  })
  const resultado = await leerRespuestaPedidos(respuesta)

  if (!resultado.data || typeof resultado.data !== 'object') {
    throw new Error(
      'El servicio de pedidos respondió correctamente, pero no devolvió los datos del pedido.'
    )
  }

  const pedido = resultado.data
  return {
    ...pedido,
    cliente: datosPedido.cliente || pedido.customerId,
    direccion: pedido.deliveryAddress,
    descripcion: pedido.notes,
    estado: pedido.status,
    fecha: pedido.createdAt
      ? new Date(pedido.createdAt).toLocaleDateString('es-EC')
      : '',
  }
}

async function solicitarPedidos(url, opciones) {
  try {
    return await fetch(url, opciones)
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        'No se pudo conectar con el servicio de pedidos. Verifica que el backend esté activo y que la URL de la API sea correcta.',
        { cause: error }
      )
    }

    throw error
  }
}

async function leerRespuestaPedidos(respuesta) {
  let resultado
  try {
    resultado = await respuesta.json()
  } catch (error) {
    if (!respuesta.ok) {
      throw new Error(
        `El servicio de pedidos respondió con un error (HTTP ${respuesta.status}) y un cuerpo inválido.`,
        { cause: error }
      )
    }

    throw new Error('El servicio de pedidos devolvió una respuesta inválida.', {
      cause: error,
    })
  }

  if (!resultado || typeof resultado !== 'object' || Array.isArray(resultado)) {
    throw new Error(
      'El servicio de pedidos devolvió una respuesta inválida: se esperaba un objeto JSON.'
    )
  }

  if (!respuesta.ok || resultado.success === false) {
    throw new Error(
      resultado.message ||
        `La solicitud al servicio de pedidos falló (HTTP ${respuesta.status}).`
    )
  }

  return resultado
}

export async function actualizarEstadoPedido(id, estado) {
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

export { API_URL }
