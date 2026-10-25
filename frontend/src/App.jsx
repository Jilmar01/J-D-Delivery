
import { useState } from 'react'

function App() {
  const [pedidos, setPedidos] = useState([])
  const [cliente, setCliente] = useState('')
  const [direccion, setDireccion] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [mensaje, setMensaje] = useState('')

  function crearPedido(e) {
    e.preventDefault()

    const nuevoPedido = {
      id: Date.now(),
      cliente,
      direccion,
      descripcion,
      estado: 'PENDIENTE',
      fecha: new Date().toLocaleDateString('es-EC'),
    }

    setPedidos((anteriores) => [...anteriores, nuevoPedido])
    setCliente('')
    setDireccion('')
    setDescripcion('')
    setMensaje('¡Pedido registrado correctamente!')
  }

  function actualizarEstado(id, nuevoEstado) {
    setPedidos((anteriores) =>
      anteriores.map((pedido) =>
        pedido.id === id
          ? { ...pedido, estado: nuevoEstado }
          : pedido
      )
    )
  }

  function colorEstado(estado) {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-amber-100 text-amber-800'
      case 'ASIGNADO':
        return 'bg-blue-100 text-blue-800'
      case 'EN_CAMINO':
        return 'bg-purple-100 text-purple-800'
      case 'ENTREGADO':
        return 'bg-green-100 text-green-800'
      case 'CANCELADO':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="bg-indigo-700 text-white shadow-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
          <div>
            <h1 className="text-2xl font-bold">J-D Delivery</h1>
            <p className="mt-1 text-sm text-indigo-100">
              Sistema de gestión de pedidos y entregas
            </p>
          </div>

          <span className="rounded-full bg-white/15 px-3 py-2 text-sm">
            Portal del cliente
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-5 py-8">
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">
            Registrar un pedido
          </h2>

          <p className="mb-6 mt-2 text-sm text-slate-500">
            Completa los siguientes datos para solicitar una entrega.
          </p>

          <form onSubmit={crearPedido} className="space-y-5">
            <div>
              <label
                htmlFor="cliente"
                className="mb-2 block text-sm font-medium"
              >
                Nombre del cliente
              </label>

              <input
                id="cliente"
                type="text"
                value={cliente}
                onChange={(e) => {
                  setCliente(e.target.value)
                  setMensaje('')
                }}
                placeholder="Ingresa tu nombre"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                required
              />
            </div>

            <div>
              <label
                htmlFor="direccion"
                className="mb-2 block text-sm font-medium"
              >
                Dirección de entrega
              </label>

              <input
                id="direccion"
                type="text"
                value={direccion}
                onChange={(e) => {
                  setDireccion(e.target.value)
                  setMensaje('')
                }}
                placeholder="Ej. Quito, sector centro"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                required
              />
            </div>

            <div>
              <label
                htmlFor="descripcion"
                className="mb-2 block text-sm font-medium"
              >
                Descripción del pedido
              </label>

              <textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => {
                  setDescripcion(e.target.value)
                  setMensaje('')
                }}
                placeholder="Describe lo que deseas solicitar"
                rows={3}
                className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 sm:w-auto"
            >
              Registrar pedido
            </button>

            {mensaje && (
              <p
                role="status"
                className="rounded-lg bg-green-50 p-3 text-sm font-medium text-green-700"
              >
                {mensaje}
              </p>
            )}
          </form>
        </section>

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
                      {['PENDIENTE', 'ASIGNADO', 'EN_CAMINO', 'ENTREGADO'].map(
                        (estado) => (
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
                        )
                      )}
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
      </main>

      <footer className="px-5 py-6 text-center text-sm text-slate-500">
        J-D Delivery · Sistema distribuido de gestión de pedidos y entregas
      </footer>
    </div>
  )
}

export default App
