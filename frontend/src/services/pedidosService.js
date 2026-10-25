
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/**
 * Servicio de pedidos.
 * Por ahora permite trabajar con datos simulados.
 * Cuando conozcamos los endpoints reales, conectaremos el backend.
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

export { API_URL }
