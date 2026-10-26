
import { useEffect, useState } from 'react'
import {
  obtenerPedidos,
  actualizarEstadoPedido,
} from '../services/pedidosService'
import { etiquetaEstado } from '../utils/estados'

const SIGUIENTE_ACCION = {
  PENDIENTE: { estado: 'ASIGNADO', texto: 'Aceptar pedido' },
  ASIGNADO: { estado: 'EN_CAMINO', texto: 'Iniciar entrega' },
  EN_CAMINO: { estado: 'ENTREGADO', texto: 'Marcar como entregado' },
}

const ESTILOS_ESTADO = {
  PENDIENTE: 'border-amber-200 bg-amber-50 text-amber-800',
  ASIGNADO: 'border-blue-200 bg-blue-50 text-blue-800',
  EN_CAMINO: 'border-violet-200 bg-violet-50 text-violet-800',
  ENTREGADO: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  CANCELADO: 'border-red-200 bg-red-50 text-red-800',
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
  const entregados = pedidos.filter((p) => p.estado === 'ENTREGADO').length
  const pendientes = pedidos.filter((p) => p.estado === 'PENDIENTE').length

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-7 px-4 py-7 sm:space-y-8 sm:px-8 sm:py-10">
        <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B2A50] via-[#0A1E39] to-[#07172D] p-6 text-white shadow-xl shadow-blue-950/10 sm:p-9">
          <div className="absolute -right-12 -top-20 -z-10 h-64 w-64 rounded-full bg-blue-400/15 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300 sm:text-sm">
                Panel del repartidor
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Tus entregas
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-50/75 sm:text-base">
                Revisa cada pedido y avanza su estado durante la entrega.
              </p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold text-blue-50 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-blue-300" />
              {activos.length} entregas activas
            </div>
          </div>
        </section>

        <section
          aria-label="Resumen de pedidos"
          className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total de pedidos
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              {pedidos.length}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm shadow-slate-200/60 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Pendientes
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-amber-700">
              {pendientes}
            </p>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm shadow-slate-200/60 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              En camino
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-violet-700">
              {pedidos.filter((p) => p.estado === 'EN_CAMINO').length}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm shadow-slate-200/60 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Entregadas
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-700">
              {entregados}
            </p>
          </div>
        </section>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-5 text-red-700"
          >
            {error}
          </p>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-7">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-950 sm:text-xl">
                Pedidos disponibles
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Revisa los detalles antes de avanzar cada entrega.
              </p>
            </div>
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-800">
              {pedidos.length} pedidos
            </span>
          </div>

          <div className="p-4 sm:p-6">
            {cargando ? (
              <div
                role="status"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-12 text-center"
              >
                <p className="text-sm font-medium text-slate-600">
                  Cargando pedidos...
                </p>
              </div>
            ) : pedidos.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    className="h-7 w-7"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 7h18v14H3zM7 7V4h10v3M8 12h8M8 16h5"
                    />
                  </svg>
                </span>
                <p className="mt-4 font-semibold text-slate-800">
                  Todavía no hay pedidos registrados.
                </p>
                <p className="mt-1.5 text-sm text-slate-500">
                  Los pedidos disponibles aparecerán aquí.
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {pedidos.map((pedido) => {
                  const accion = SIGUIENTE_ACCION[pedido.estado]

                  return (
                    <li
                      key={pedido.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 transition hover:border-blue-200 hover:shadow-md hover:shadow-slate-200/70 sm:p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Identificador del pedido
                          </p>
                          <h3 className="mt-1.5 break-all text-lg font-bold tracking-tight text-slate-950">
                            PED-{String(pedido.id).slice(-6)}
                          </h3>
                          <p className="mt-1 break-words text-sm text-slate-500">
                            {pedido.cliente} · {pedido.fecha}
                          </p>
                        </div>

                        <span
                          className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                            ESTILOS_ESTADO[pedido.estado] ||
                            'border-slate-200 bg-slate-100 text-slate-700'
                          }`}
                        >
                          {etiquetaEstado(pedido.estado)}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl bg-blue-50/70 p-4 sm:col-span-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">
                            Dirección de entrega
                          </p>
                          <p className="mt-1.5 break-words text-sm font-medium leading-6 text-slate-800">
                            {pedido.direccion}
                          </p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Detalle del pedido
                          </p>
                          <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                            {pedido.descripcion}
                          </p>
                        </div>
                      </div>

                      {accion && (
                        <div className="mt-5 border-t border-slate-100 pt-4">
                          <button
                            type="button"
                            onClick={() => avanzarEstado(pedido)}
                            className="w-full rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-900/15 transition hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-blue-900/20 focus:outline-none focus:ring-4 focus:ring-blue-600/20 active:scale-[0.99] sm:w-auto"
                          >
                            {accion.texto}
                          </button>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

export default PanelRepartidor
