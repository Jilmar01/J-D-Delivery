const API_URL =
  import.meta.env.VITE_ORDERS_API_URL ||
  import.meta.env.VITE_API_URL ||
  'https://gph6pj52-3001.use2.devtunnels.ms'

const PEDIDOS_API_URL = `${API_URL.replace(/\/+$/, '')}/api/orders`

function crearError(mensaje, status, causa) {
  const error = new Error(mensaje, causa ? { cause: causa } : undefined)
  if (status !== undefined) error.status = status
  return error
}

function validarToken(token) {
  if (typeof token !== 'string' || !token.trim()) {
    throw new Error(
      'No hay un token de sesión disponible. Inicia sesión nuevamente.'
    )
  }

  return token.trim()
}

function encabezadosAutenticados(token, incluirJson = false) {
  return {
    Authorization: `Bearer ${validarToken(token)}`,
    ...(incluirJson ? { 'Content-Type': 'application/json' } : {}),
  }
}

async function solicitarPedidos(opciones) {
  try {
    return await fetch(PEDIDOS_API_URL, opciones)
  } catch (error) {
    if (error instanceof TypeError) {
      throw crearError(
        'No se pudo conectar con el servicio de pedidos. Verifica que el backend esté activo y que la URL sea correcta.',
        undefined,
        error
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
    throw crearError(
      respuesta.ok
        ? 'El servicio de pedidos devolvió una respuesta inválida.'
        : `La solicitud falló (HTTP ${respuesta.status}) y el servidor no devolvió JSON válido.`,
      respuesta.status,
      error
    )
  }

  if (
    !resultado ||
    typeof resultado !== 'object' ||
    Array.isArray(resultado)
  ) {
    throw crearError(
      'El servicio de pedidos devolvió una respuesta JSON inválida.',
      respuesta.status
    )
  }

  if (!respuesta.ok || resultado.success === false) {
    const mensaje =
      respuesta.status === 401
        ? 'La sesión expiró o el token no es válido. Inicia sesión nuevamente.'
        : respuesta.status === 403
          ? 'No tienes permiso para realizar esta operación.'
          : resultado.message ||
            `La solicitud al servicio de pedidos falló (HTTP ${respuesta.status}).`

    throw crearError(mensaje, respuesta.status)
  }

  return resultado
}

function normalizarPedido(pedido) {
  if (!pedido || typeof pedido !== 'object' || Array.isArray(pedido)) {
    throw new Error('El servicio devolvió un pedido con formato inválido.')
  }

  return {
    ...pedido,
    cliente:
      pedido.customer?.username ||
      pedido.customer?.name ||
      pedido.cliente ||
      '',
    direccion: pedido.deliveryAddress ?? pedido.direccion ?? '',
    descripcion: pedido.notes ?? pedido.descripcion ?? '',
    estado: pedido.status ?? pedido.estado,
    fecha: pedido.createdAt
      ? new Date(pedido.createdAt).toLocaleDateString('es-EC')
      : pedido.fecha || '',
  }
}

function extraerListaPedidos(resultado) {
  if (!Array.isArray(resultado.data)) {
    throw new Error(
      'La respuesta del backend no contiene la lista de pedidos esperada en data.'
    )
  }

  return resultado.data.map(normalizarPedido)
}

function extraerPedidoCreado(resultado) {
  if (
    !resultado.data ||
    typeof resultado.data !== 'object' ||
    Array.isArray(resultado.data) ||
    resultado.data.id === undefined ||
    resultado.data.id === null
  ) {
    throw new Error(
      'El backend no confirmó la creación con los datos e ID del pedido.'
    )
  }

  return normalizarPedido(resultado.data)
}

/**
 * Obtiene los pedidos del endpoint configurado usando el token de sesión.
 */
export async function obtenerPedidos(token) {
  const respuesta = await solicitarPedidos({
    method: 'GET',
    headers: encabezadosAutenticados(token),
  })

  return extraerListaPedidos(await leerRespuestaPedidos(respuesta))
}

/**
 * Filtra la lista por el customerId real confirmado para la cuenta.
 */
export async function obtenerPedidosCliente(customerId, token) {
  if (typeof customerId !== 'string' || !customerId.trim()) {
    throw new Error(
      'No se pueden consultar los pedidos: falta el customerId real de la cuenta.'
    )
  }

  const pedidos = await obtenerPedidos(token)

  return pedidos.filter(
    (pedido) => String(pedido.customerId) === customerId.trim()
  )
}

/**
 * Envía únicamente los campos aceptados por el handler actual de creación.
 * La API de pedidos no declara campos para coordenadas.
 */
export async function crearPedido(datosPedido = {}, token) {
  const tokenValidado = validarToken(token)
  const {
    customerId,
    deliveryAddress,
    notes = '',
    total,
    items,
  } = datosPedido

  if (typeof customerId !== 'string' || !customerId.trim()) {
    throw new Error(
      'No se puede registrar el pedido: falta el customerId real de la cuenta.'
    )
  }

  if (typeof deliveryAddress !== 'string' || !deliveryAddress.trim()) {
    throw new Error(
      'No se puede registrar el pedido: falta la dirección de entrega.'
    )
  }

  if (typeof notes !== 'string') {
    throw new Error('Las notas del pedido deben ser texto.')
  }

  const totalNumerico = Number(total)
  if (!Number.isFinite(totalNumerico) || totalNumerico <= 0) {
    throw new Error('El total del pedido debe ser mayor que cero.')
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Agrega productos del catálogo real antes de enviar.')
  }

  const itemsValidos = items.every(
    (item) =>
      item &&
      item.idLocalDemo === undefined &&
      item.unitPriceDemo === undefined &&
      Number.isSafeInteger(item.productId) &&
      item.productId > 0 &&
      typeof item.productName === 'string' &&
      item.productName.trim() &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0 &&
      Number.isFinite(Number(item.unitPrice)) &&
      Number(item.unitPrice) > 0
  )

  if (!itemsValidos) {
    throw new Error(
      'Cada producto debe tener un ID entero real, nombre, cantidad y precio unitario válidos.'
    )
  }

  const totalCalculado = items.reduce(
    (suma, item) => suma + Number(item.unitPrice) * item.quantity,
    0
  )

  if (Math.abs(totalCalculado - totalNumerico) > 0.01) {
    throw new Error(
      'El total no coincide con la suma de los productos del pedido.'
    )
  }

  const cuerpo = {
    customerId: customerId.trim(),
    deliveryAddress: deliveryAddress.trim(),
    notes: notes.trim(),
    total: totalNumerico,
    items: items.map((item) => ({
      productId: item.productId,
      productName: item.productName.trim(),
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
    })),
  }

  const respuesta = await solicitarPedidos({
    method: 'POST',
    headers: encabezadosAutenticados(tokenValidado, true),
    body: JSON.stringify(cuerpo),
  })

  return extraerPedidoCreado(await leerRespuestaPedidos(respuesta))
}

export { API_URL }
