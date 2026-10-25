
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
    'w-full rounded-xl border border-zinc-700 bg-[#09090B] px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'

  return (
    <section className="rounded-xl bg-transparent">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">
          Registrar un pedido
        </h2>

        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Completa los siguientes datos para solicitar una entrega.
        </p>
      </div>

      <form onSubmit={crearPedido} className="space-y-5">
        <div>
          <label
            htmlFor="cliente"
            className="mb-2 block text-sm font-medium text-zinc-200"
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
            className="mb-2 block text-sm font-medium text-zinc-200"
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

        <div>
          <label
            htmlFor="descripcion"
            className="mb-2 block text-sm font-medium text-zinc-200"
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
            className={`${estiloCampo} resize-y`}
            required
          />
        </div>

        <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center">
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 active:scale-[0.99]"
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
            className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-400"
          >
            {mensaje}
          </p>
        )}
      </form>
    </section>
  )
}

export default FormularioPedido
