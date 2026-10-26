
function FormularioPedido({
  cliente,
  setCliente,
  direccion,
  setDireccion,
  descripcion,
  setDescripcion,
  crearPedido,
  mensaje,
  setMensaje,
}) {
  const estiloCampo =
    'w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm shadow-slate-200/50 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'

  return (
    <section className="rounded-xl bg-transparent">
      <form onSubmit={crearPedido} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="cliente"
              className="mb-2 block text-sm font-semibold text-slate-700"
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
              className={estiloCampo}
              required
            />
          </div>

          <div>
            <label
              htmlFor="direccion"
              className="mb-2 block text-sm font-semibold text-slate-700"
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
              className={estiloCampo}
              required
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="descripcion"
            className="mb-2 block text-sm font-semibold text-slate-700"
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
            rows={4}
            className={`${estiloCampo} min-h-32 resize-y`}
            required
          />
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-500">
            Revisa que la dirección y los detalles estén correctos.
          </p>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/15 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-blue-900/20 focus:outline-none focus:ring-4 focus:ring-blue-600/20 active:scale-[0.99] sm:w-auto"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 5v14m-7-7h14"
              />
            </svg>

            Registrar pedido
          </button>
        </div>

        {mensaje && (
          <p
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium leading-5 text-emerald-800"
          >
            {mensaje}
          </p>
        )}
      </form>
    </section>
  )
}

export default FormularioPedido
