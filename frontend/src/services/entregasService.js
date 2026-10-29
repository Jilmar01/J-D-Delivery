const API_URL = import.meta.env.DEV
  ? '/deliveries-api'
  : (import.meta.env.URL_DELIVERIES || '').replace(/\/$/, '')

export async function obtenerEntregasPorPedidos(pedidos, token) {
  return Promise.all(
    pedidos.map(async (pedido) => {
      const orderId = Number(pedido.id)

      if (!Number.isSafeInteger(orderId) || orderId < 1) {
        return { orderId: pedido.id, status: 'error' }
      }

      if (!API_URL) {
        return { orderId, status: 'error' }
      }

      try {
        const headers = token
          ? { Authorization: `Bearer ${token}` }
          : undefined
        const respuesta = await fetch(
          `${API_URL}/api/deliveries/order/${orderId}`,
          { headers }
        )

        if (respuesta.status === 404) {
          return { orderId, status: 'missing' }
        }

        const resultado = await respuesta.json().catch(() => null)

        if (!respuesta.ok || !resultado?.success || !resultado.data) {
          return { orderId, status: 'error' }
        }

        if (Number(resultado.data.orderId) !== orderId) {
          return { orderId, status: 'error' }
        }

        return {
          orderId,
          status: 'loaded',
          data: resultado.data,
        }
      } catch {
        return { orderId, status: 'error' }
      }
    })
  )
}
