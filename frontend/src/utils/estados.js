
export const ESTADOS_PROGRESO_PEDIDO = [
  'PENDIENTE',
  'ASIGNADO',
  'EN_CAMINO',
  'ENTREGADO',
]

export const SIGUIENTE_ESTADO_PEDIDO = {
  PENDIENTE: 'ASIGNADO',
  ASIGNADO: 'EN_CAMINO',
  EN_CAMINO: 'ENTREGADO',
}

export function permiteTransicionPedido(estadoActual, nuevoEstado) {
  return SIGUIENTE_ESTADO_PEDIDO[estadoActual] === nuevoEstado
}

export function colorEstado(estado) {
  switch (estado) {
    case 'PENDIENTE':
      return 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20'
    case 'ASIGNADO':
      return 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20'
    case 'EN_CAMINO':
      return 'bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20'
    case 'ENTREGADO':
      return 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
    case 'CANCELADO':
      return 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'
    default:
      return 'bg-zinc-700 text-zinc-300'
  }
}

export function etiquetaEstado(estado) {
  return estado.replace('_', ' ')
}
