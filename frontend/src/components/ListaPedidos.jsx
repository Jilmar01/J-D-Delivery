
const ESTILOS_ESTADO = {
  PENDIENTE: 'border-amber-200 bg-amber-50 text-amber-800',
  ASIGNADO: 'border-blue-200 bg-blue-50 text-blue-800',
  EN_CAMINO: 'border-violet-200 bg-violet-50 text-violet-800',
  ENTREGADO: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  CANCELADO: 'border-red-200 bg-red-50 text-red-800',
}

function ListaPedidos({ pedidos, actualizarEstado }) {
  return (
    <section className="rounded-xl bg-transparent">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-800">
            Pedidos registrados
          </h3>
          <p className="mt-1.5 text-sm text-slate-500">
            Consulta tus pedidos y revisa su estado actual.
          </p>
        </div>

        <span className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800">
          Total: {pedidos.length}
        </span>
      </div>

      {pedidos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="h-7 w-7 text-blue-700"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 7h18v14H3zM7 7V4h10v3M8 12h8M8 16h5"
              />
            </svg>
          </div>

          <p className="mt-4 font-semibold text-slate-800">
            Todavía no tienes pedidos registrados.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Utiliza el formulario para crear tu primer pedido.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => (
            <article
              key={pedido.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 transition hover:border-blue-200 hover:shadow-md hover:shadow-slate-200/70 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Identificador del pedido
                  </p>
                  <h3 className="mt-1.5 text-lg font-bold tracking-tight text-slate-950">
                    PED-{String(pedido.id).slice(-6)}
                  </h3>
                </div>

                <span
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                    ESTILOS_ESTADO[pedido.estado] ||
                    'border-slate-200 bg-slate-100 text-slate-700'
                  }`}
                >
                  {pedido.estado.replace('_', ' ')}
                </span>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Cliente
                  </p>
                  <p className="mt-1.5 break-words text-sm font-medium text-slate-800">
                    {pedido.cliente}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Fecha de creación
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-slate-800">
                    {pedido.fecha}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Dirección de entrega
                  </p>
                  <p className="mt-1.5 break-words text-sm leading-6 text-slate-800">
                    {pedido.direccion}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Descripción del pedido
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                    {pedido.descripcion}
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-5">
                <h4 className="text-sm font-semibold text-slate-800">
                  Seguimiento del pedido
                </h4>

                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    'PENDIENTE',
                    'ASIGNADO',
                    'EN_CAMINO',
                    'ENTREGADO',
                  ].map((estado) => (
                    <span
                      key={estado}
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                        pedido.estado === estado
                          ? ESTILOS_ESTADO[estado]
                          : 'border-slate-200 bg-slate-50 text-slate-500'
                      }`}
                    >
                      {estado.replace('_', ' ')}
                    </span>
                  ))}
                </div>

                <label
                  htmlFor={`estado-${pedido.id}`}
                  className="mb-2 mt-5 block text-sm font-semibold text-slate-700"
                >
                  Estado de demostración
                </label>

                <select
                  id={`estado-${pedido.id}`}
                  value={pedido.estado}
                  onChange={(e) =>
                    actualizarEstado(pedido.id, e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition hover:border-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 sm:max-w-xs"
                >
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="ASIGNADO">Asignado</option>
                  <option value="EN_CAMINO">En camino</option>
                  <option value="ENTREGADO">Entregado</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Los cambios de estado son solo para pruebas locales.
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default ListaPedidos
