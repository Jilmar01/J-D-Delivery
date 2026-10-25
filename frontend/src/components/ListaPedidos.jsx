
function ListaPedidos({ pedidos, actualizarEstado, colorEstado }) {
  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Mis pedidos</h2>
          <p className="mt-2 text-sm text-slate-500">
            Consulta tus pedidos y revisa su estado actual.
          </p>
        </div>

        <span className="rounded-full bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700">
          Total: {pedidos.length}
        </span>
      </div>

      {pedidos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
          <p className="font-medium text-slate-600">
            Todavía no tienes pedidos registrados.
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Utiliza el formulario para crear tu primer pedido.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => (
            <article
              key={pedido.id}
              className="rounded-xl border border-slate-200 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">
                    Identificador del pedido
                  </p>
                  <h3 className="mt-1 font-bold">
                    PED-{String(pedido.id).slice(-6)}
                  </h3>
                </div>

                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${colorEstado(pedido.estado)}`}
                >
                  {pedido.estado.replace('_', ' ')}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Cliente</p>
                  <p className="mt-1 font-medium">{pedido.cliente}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Fecha de creación
                  </p>
                  <p className="mt-1 font-medium">{pedido.fecha}</p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-500">
                    Dirección de entrega
                  </p>
                  <p className="mt-1">{pedido.direccion}</p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-500">
                    Descripción
                  </p>
                  <p className="mt-1">{pedido.descripcion}</p>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="mb-2 text-sm font-semibold">
                  Seguimiento del pedido
                </p>

                <div className="flex flex-wrap gap-2">
                  {[
                    'PENDIENTE',
                    'ASIGNADO',
                    'EN_CAMINO',
                    'ENTREGADO',
                  ].map((estado) => (
                    <span
                      key={estado}
                      className={`rounded-md px-2 py-1 text-xs ${
                        pedido.estado === estado
                          ? colorEstado(estado)
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {estado.replace('_', ' ')}
                    </span>
                  ))}
                </div>

                <label
                  htmlFor={`estado-${pedido.id}`}
                  className="mb-2 mt-4 block text-sm text-slate-600"
                >
                  Estado de demostración
                </label>

                <select
                  id={`estado-${pedido.id}`}
                  value={pedido.estado}
                  onChange={(e) =>
                    actualizarEstado(pedido.id, e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 sm:max-w-xs"
                >
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="ASIGNADO">Asignado</option>
                  <option value="EN_CAMINO">En camino</option>
                  <option value="ENTREGADO">Entregado</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>

                <p className="mt-2 text-xs text-slate-400">
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
