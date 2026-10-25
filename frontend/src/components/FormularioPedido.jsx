
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
  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">Registrar un pedido</h2>

      <p className="mb-6 mt-2 text-sm text-slate-500">
        Completa los siguientes datos para solicitar una entrega.
      </p>

      <form onSubmit={crearPedido} className="space-y-5">
        <div>
          <label htmlFor="cliente" className="mb-2 block text-sm font-medium">
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
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            required
          />
        </div>

        <div>
          <label htmlFor="direccion" className="mb-2 block text-sm font-medium">
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
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            required
          />
        </div>

        <div>
          <label htmlFor="descripcion" className="mb-2 block text-sm font-medium">
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
            className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
  )
}

export default FormularioPedido
