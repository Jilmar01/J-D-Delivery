
function ListaPedidos({ pedidos, actualizarEstado, colorEstado }) {
  return (
    <section className="rounded-xl bg-transparent">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">
            Mis pedidos
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Consulta tus pedidos y revisa su estado actual.
          </p>
        </div>

        <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-400">
          Total: {pedidos.length}
        </span>
      </div>

      {pedidos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-700 bg-[#09090B] px-4 py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="h-7 w-7 text-blue-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 7h18v14H3zM7 7V4h10v3M8 12h8M8 16h5"
              />
            </svg>
          </div>

          <p className="mt-4 font-semibold text-zinc-200">
            Todavía no tienes pedidos registrados.
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Utiliza el formulario para crear tu primer pedido.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => (
            <article
              key={pedido.id}
              className="rounded-2xl border border-zinc-800 bg-[#09090B] p-5 transition hover:border-blue-500/30 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Identificador del pedido
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-white">
                    PED-{String(pedido.id).slice(-6)}
                  </h3>
                </div>

                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${colorEstado(pedido.estado)}`}
                >
                  {pedido.estado.replace('_', ' ')}
                </span>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-zinc-500">
                    Cliente
                  </p>
                  <p className="mt-1.5 break-words text-sm font-medium text-zinc-200">
                    {pedido.cliente}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-zinc-500">
                    Fecha de creación
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-zinc-200">
                    {pedido.fecha}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-zinc-500">
                    Dirección de entrega
                  </p>
                  <p className="mt-1.5 break-words text-sm leading-6 text-zinc-200">
                    {pedido.direccion}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-zinc-500">
                    Descripción del pedido
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-300">
                    {pedido.descripcion}
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-zinc-800 pt-5">
                <h4 className="text-sm font-semibold text-zinc-200">
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
                      className={`rounded-lg px-3 py-2 text-xs font-medium ${
                        pedido.estado === estado
                          ? colorEstado(estado)
                          : 'border border-zinc-800 bg-zinc-900 text-zinc-500'
                      }`}
                    >
                      {estado.replace('_', ' ')}
                    </span>
                  ))}
                </div>

                <label
                  htmlFor={`estado-${pedido.id}`}
                  className="mb-2 mt-5 block text-sm font-medium text-zinc-300"
                >
                  Estado de demostración
                </label>

                <select
                  id={`estado-${pedido.id}`}
                  value={pedido.estado}
                  onChange={(e) =>
                    actualizarEstado(pedido.id, e.target.value)
                  }
                  className="w-full rounded-xl border border-zinc-700 bg-[#18181B] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:max-w-xs"
                >
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="ASIGNADO">Asignado</option>
                  <option value="EN_CAMINO">En camino</option>
                  <option value="ENTREGADO">Entregado</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>

                <p className="mt-2 text-xs leading-5 text-zinc-500">
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
