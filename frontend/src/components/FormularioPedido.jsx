
import { useCallback } from 'react'
import MapaUbicacion from './MapaUbicacion'

function FormularioPedido({
  cliente,
  setCliente,
  direccion,
  setDireccion,
  descripcion,
  setDescripcion,
  ubicacionPendiente,
  ubicacionConfirmada,
  deliveryLat,
  deliveryLng,
  productosCarritoDemo,
  totalCarritoDemo,
  pedidoBorradorDemo,
  alEditarPedido,
  setUbicacionPendiente,
  setDeliveryLat,
  setDeliveryLng,
  confirmarUbicacion,
  crearPedido,
  registrarPedidoPrueba,
  registrandoPedidoPrueba,
  mensaje,
}) {
  const estiloCampo =
    'w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm shadow-slate-200/50 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
  const formatoMoneda = new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  })

  const alCambiarUbicacionPendiente = useCallback(
    (ubicacion) => {
      alEditarPedido()
      setUbicacionPendiente(ubicacion)
      setDeliveryLat(Number.isFinite(ubicacion.lat) ? ubicacion.lat : null)
      setDeliveryLng(Number.isFinite(ubicacion.lng) ? ubicacion.lng : null)
      if (ubicacionConfirmada) confirmarUbicacion(null)
    },
    [
      alEditarPedido,
      confirmarUbicacion,
      setDeliveryLat,
      setDeliveryLng,
      setUbicacionPendiente,
      ubicacionConfirmada,
    ]
  )
  const alConfirmarUbicacion = useCallback(
    (ubicacion) => {
      alEditarPedido()
      confirmarUbicacion(ubicacion)
      setDeliveryLat(Number.isFinite(ubicacion.lat) ? ubicacion.lat : null)
      setDeliveryLng(Number.isFinite(ubicacion.lng) ? ubicacion.lng : null)
      setDireccion(ubicacion.direccion || '')
    },
    [
      alEditarPedido,
      confirmarUbicacion,
      setDeliveryLat,
      setDeliveryLng,
      setDireccion,
    ]
  )

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
                alEditarPedido()
                setCliente(e.target.value)
              }}
              placeholder="Ingresa tu nombre"
              className={estiloCampo}
              required
            />
          </div>
          <div className="space-y-4">
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
                  alEditarPedido()
                  setDireccion(e.target.value)
                  setUbicacionPendiente(null)
                  setDeliveryLat(null)
                  setDeliveryLng(null)
                  if (ubicacionConfirmada) confirmarUbicacion(null)
                }}
                placeholder="Ej. Quito, sector centro"
                className={estiloCampo}
                required
              />
            </div>

            <MapaUbicacion
              ubicacionPendiente={ubicacionPendiente}
              ubicacionConfirmada={ubicacionConfirmada}
              alCambiarUbicacionPendiente={alCambiarUbicacionPendiente}
              alConfirmarUbicacion={alConfirmarUbicacion}
            />
            {(!Number.isFinite(deliveryLat) ||
              deliveryLat < -90 ||
              deliveryLat > 90 ||
              !Number.isFinite(deliveryLng) ||
              deliveryLng < -180 ||
              deliveryLng > 180) && (
              <p
                role="status"
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-900"
              >
                Selecciona una ubicación válida en el mapa para incluir
                latitud y longitud en el borrador.
              </p>
            )}
          </div>
        </div>

        <section
          aria-label="Resumen del carrito de demostración"
          className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Resumen del carrito
            </h3>
            <span className="text-xs font-semibold text-amber-800">
              Datos y precios temporales
            </span>
          </div>
          {productosCarritoDemo.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">
              No hay productos seleccionados.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-amber-200/70">
              {productosCarritoDemo.map((producto) => (
                <li
                  key={producto.idLocal}
                  className="flex flex-wrap justify-between gap-2 py-2 text-sm"
                >
                  <span className="text-slate-700">
                    {producto.nombre} × {producto.cantidad}
                  </span>
                  <span className="font-medium text-slate-800">
                    {formatoMoneda.format(
                      (Math.round(producto.precioDemo * 100) *
                        producto.cantidad) /
                        100
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-right text-base font-bold text-slate-950">
            Total temporal: {formatoMoneda.format(totalCarritoDemo / 100)}
          </p>
          <p className="mt-1 text-xs leading-5 text-amber-800">
            Este resumen se conserva mientras completas la dirección y las
            notas. No se envía al backend.
          </p>
        </section>

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
              alEditarPedido()
              setDescripcion(e.target.value)
            }}
            placeholder="Describe lo que deseas solicitar"
            rows={4}
            className={`${estiloCampo} min-h-32 resize-y`}
            required
          />
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

              Preparar pedido de demostración
            </button>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">
              Prueba temporal del backend
            </p>
            <p className="mt-1 text-xs leading-5 text-amber-800">
              Envía customerId y productos de prueba; usa la dirección, notas y
              coordenadas actuales del formulario. No utiliza el carrito demo y
              puede crear un registro de prueba en la base de datos.
            </p>
            <button
              type="button"
              onClick={registrarPedidoPrueba}
              disabled={registrandoPedidoPrueba}
              aria-busy={registrandoPedidoPrueba}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-700 bg-white px-5 py-3 text-sm font-semibold text-amber-900 transition hover:bg-amber-100 focus:outline-none focus:ring-4 focus:ring-amber-600/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {registrandoPedidoPrueba
                ? 'Enviando pedido de prueba...'
                : 'Enviar pedido de prueba al backend'}
            </button>
          </div>
        </div>

        {pedidoBorradorDemo && (
          <section
            aria-label="Borrador de demostración preparado"
            className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950"
          >
            <h3 className="font-semibold">Borrador temporal preparado</h3>
            <p className="mt-2">
              Dirección: {pedidoBorradorDemo.deliveryAddress}
            </p>
            <p className="mt-1">Notas: {pedidoBorradorDemo.notes}</p>
            <ul className="mt-2 list-inside list-disc">
              {pedidoBorradorDemo.items.map((item) => (
                <li key={item.idLocalDemo}>
                  {item.productNameDemo} × {item.quantity} ·{' '}
                  {formatoMoneda.format(item.unitPriceDemo)} (precio demo)
                </li>
              ))}
            </ul>
            <p className="mt-2 font-semibold">
              Total temporal: {formatoMoneda.format(pedidoBorradorDemo.totalDemo)}
            </p>
            {Number.isFinite(pedidoBorradorDemo.deliveryLat) &&
            Number.isFinite(pedidoBorradorDemo.deliveryLng) ? (
              <p className="mt-2 text-xs">
                Coordenadas: {pedidoBorradorDemo.deliveryLat.toFixed(6)},{' '}
                {pedidoBorradorDemo.deliveryLng.toFixed(6)}
              </p>
            ) : (
              <p className="mt-2 text-xs text-amber-800">
                El borrador no incluye coordenadas porque no se confirmó una
                ubicación en el mapa.
              </p>
            )}
            <p className="mt-2 text-xs leading-5 text-blue-800">
              Los identificadores y precios son exclusivamente de demostración;
              este borrador no representa un pedido registrado.
            </p>
          </section>
        )}

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
