
import { useEffect, useState } from 'react'
import {
  obtenerPedidos,
  actualizarEstadoPedido,
} from '../services/pedidosService'
import { colorEstado, etiquetaEstado } from '../utils/estados'

const SIGUIENTE_ACCION = {
  PENDIENTE: { estado: 'ASIGNADO', texto: 'Aceptar pedido' },
  ASIGNADO: { estado: 'EN_CAMINO', texto: 'Iniciar entrega' },
  EN_CAMINO: { estado: 'ENTREGADO', texto: 'Marcar como entregado' },
}

function PanelRepartidor() {
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargarPedidos() {
      try {
        setPedidos(await obtenerPedidos())
      } catch {
        setError('No se pudieron cargar los pedidos.')
      } finally {
        setCargando(false)
      }
    }

    cargarPedidos()
  }, [])

  async function avanzarEstado(pedido) {
    const accion = SIGUIENTE_ACCION[pedido.estado]
    if (!accion) return

    setError('')

    try {
      const actualizado = await actualizarEstadoPedido(pedido.id, accion.estado)
      setPedidos((anteriores) =>
        anteriores.map((p) => (p.id === actualizado.id ? actualizado : p))
      )
    } catch {
      setError('No se pudo actualizar el estado del pedido.')
    }
  }

  const activos = pedidos.filter(
    (p) => p.estado !== 'ENTREGADO' && p.estado !== 'CANCELADO'
  )

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-5 py-8 sm:px-8 sm:py-10">
      <section className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/50 via-[#15151A] to-[#15151A] p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
          Panel del repartidor
        </p>
        <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
          Tus entregas
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
          Acepta pedidos, inicia la entrega y márcalos como entregados.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#18181B] p-5">
          <p className="text-sm text-zinc-400">Entregas activas</p>
          <p className="mt-2 text-3xl font-bold text-white">{activos.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#18181B] p-5">
          <p className="text-sm text-zinc-400">Entregadas</p>
          <p className="mt-2 text-3xl font-bold text-white">
            {pedidos.filter((p) => p.estado === 'ENTREGADO').length}
          </p>
        </div>
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
        >
          {error}
        </p>
      )}

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#18181B] shadow-xl shadow-black/10">
        <div className="border-b border-white/10 px-5 py-5 sm:px-7">
          <h2 className="text-lg font-bold text-white sm:text-xl">
            Pedidos disponibles
          </h2>
        </div>

        <div className="p-5 sm:p-7">
          {cargando ? (
            <p className="text-sm text-zinc-400">Cargando pedidos...</p>
          ) : pedidos.length === 0 ? (
            <p className="text-sm text-zinc-400">
              Todavía no hay pedidos registrados.
            </p>
          ) : (
            <ul className="space-y-4">
              {pedidos.map((pedido) => {
                const accion = SIGUIENTE_ACCION[pedido.estado]

                return (
                  <li
                    key={pedido.id}
                    className="rounded-2xl border border-zinc-800 bg-[#09090B] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          PED-{String(pedido.id).slice(-6)}
                        </h3>
                        <p className="mt-1 text-sm text-zinc-400">
                          {pedido.cliente} · {pedido.fecha}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${colorEstado(pedido.estado)}`}
                      >
                        {etiquetaEstado(pedido.estado)}
                      </span>
                    </div>

                    <p className="mt-4 break-words text-sm text-zinc-200">
                      <span className="text-zinc-500">Dirección: </span>
                      {pedido.direccion}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-zinc-300">
                      <span className="text-zinc-500">Detalle: </span>
                      {pedido.descripcion}
                    </p>

                    {accion && (
                      <button
                        type="button"
                        onClick={() => avanzarEstado(pedido)}
                        className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                      >
                        {accion.texto}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>
    </main>
  )
}

export default PanelRepartidor
