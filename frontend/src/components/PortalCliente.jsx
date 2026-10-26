
import { useEffect, useState } from 'react'
import FormularioPedido from './FormularioPedido'
import ListaPedidos from './ListaPedidos'
import {
  obtenerPedidosCliente,
  crearPedido as guardarPedido,
} from '../services/pedidosService'
import pizza from '../assets/images/pizza.jpg'
import hamburguesa from '../assets/images/hamburguesa.jpg'
import sushi from '../assets/images/sushi.jpg'
import pollo from '../assets/images/pollo.jpg'
import ensalada from '../assets/images/ensalada.jpg'

const CATEGORIAS_DEMO = [
  { nombre: 'Restaurantes', icono: 'restaurante', imagen: hamburguesa },
  { nombre: 'Súper', icono: 'super', imagen: ensalada },
  { nombre: 'Farmacias', icono: 'farmacia' },
  { nombre: 'Bebidas', icono: 'bebidas' },
  { nombre: 'Tiendas', icono: 'tiendas' },
  { nombre: 'Mascotas', icono: 'mascotas' },
]

const COMIDAS_DEMO = [
  { nombre: 'Pizza', imagen: pizza, alt: 'Fotografía de referencia de pizza' },
  {
    nombre: 'Hamburguesa',
    imagen: hamburguesa,
    alt: 'Fotografía de referencia de hamburguesa',
  },
  { nombre: 'Sushi', imagen: sushi, alt: 'Fotografía de referencia de sushi' },
  { nombre: 'Pollo', imagen: pollo, alt: 'Fotografía de referencia de pollo' },
  {
    nombre: 'Ensalada',
    imagen: ensalada,
    alt: 'Fotografía de referencia de ensalada',
  },
]

function IconoCategoria({ tipo }) {
  const iconos = {
    restaurante: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v7m-3-7v4a3 3 0 0 0 6 0V3m-3 7v11M16 3v18m0-18c3 2 4 5 4 8h-4" />
      </>
    ),
    super: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 1.9-1.4L21 8H6" />
        <circle cx="10" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
      </>
    ),
    farmacia: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M12 7v10M7 12h10" />
      </>
    ),
    bebidas: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 4h12l-1 17H7L6 4Zm3 0V2h6v2m-7 5h10" />
      </>
    ),
    tiendas: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 9h16l-1-5H5L4 9Zm1 0v11h14V9m-9 11v-6h4v6" />
        <path strokeLinecap="round" d="M4 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" />
      </>
    ),
    mascotas: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12c-2 0-4 2-4 4 0 2 2 3 4 2l2-1h4l2 1c2 1 4 0 4-2 0-2-2-4-4-4-1 0-2 1-4 1s-3-1-4-1Z" />
        <circle cx="6" cy="8" r="1.5" />
        <circle cx="10" cy="6" r="1.5" />
        <circle cx="14" cy="6" r="1.5" />
        <circle cx="18" cy="8" r="1.5" />
      </>
    ),
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-6 w-6"
      aria-hidden="true"
    >
      {iconos[tipo]}
    </svg>
  )
}

function PortalCliente({ usuario }) {
  const [pedidos, setPedidos] = useState([])
  const [cliente, setCliente] = useState(usuario.nombre || '')
  const [direccion, setDireccion] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [ubicacionPendiente, setUbicacionPendiente] = useState(null)
  const [ubicacionConfirmada, setUbicacionConfirmada] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargarPedidos() {
      try {
        const datos = await obtenerPedidosCliente(usuario.correo)
        setPedidos(datos)
      } catch {
        setError('No se pudieron cargar los pedidos.')
      } finally {
        setCargando(false)
      }
    }

    cargarPedidos()
  }, [usuario.correo])

  async function crearPedido(e) {
    e.preventDefault()
    setMensaje('')
    setError('')

    try {
      const nuevoPedido = await guardarPedido({
        cliente,
        direccion,
        descripcion,
      }, usuario.correo)

      setPedidos((anteriores) => [...anteriores, nuevoPedido])
      setCliente(usuario.nombre || '')
      setDireccion('')
      setDescripcion('')
      setUbicacionPendiente(null)
      setUbicacionConfirmada(null)
      setMensaje('¡Pedido registrado correctamente!')
    } catch {
      setError('No se pudo registrar el pedido. Intenta nuevamente.')
    }
  }

  const nombreCorto = usuario.nombre?.trim().split(/\s+/)[0] || 'cliente'

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-7 sm:space-y-10 sm:px-8 sm:py-10">
        <section className="relative isolate min-h-[320px] overflow-hidden rounded-3xl bg-[#07172D] shadow-xl shadow-blue-950/10 sm:min-h-[350px] lg:min-h-[390px]">
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0B2A50] via-[#0B1D38] to-[#061226]" />
          <img
            src={pizza}
            alt="Fotografía de referencia de pizza"
            className="absolute inset-y-0 right-0 z-0 h-full w-full object-cover object-center opacity-55 sm:w-3/4 sm:opacity-70"
          />
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#07172D] via-[#07172D]/90 to-[#07172D]/30 sm:to-transparent" />
          <div className="relative z-20 flex min-h-[320px] flex-col justify-center p-6 sm:min-h-[350px] sm:p-10 lg:min-h-[390px] lg:p-14">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300 sm:text-sm">
              J-D Delivery
            </p>
            <h2 className="mt-3 max-w-xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              Hola, {nombreCorto}.
              <br />
              Algo rico está más cerca.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-blue-50/80 sm:text-base">
              Explora opciones y organiza tu entrega desde un solo lugar.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium text-white/90 sm:gap-3 sm:text-sm">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-sm">
                Seguimiento de pedidos
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-sm">
                Entrega organizada
              </span>
            </div>
            <a
              href="#crear-pedido"
              className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:-translate-y-0.5 hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-300/30 sm:w-fit"
            >
              Realizar un pedido
            </a>
          </div>
        </section>

        <section aria-labelledby="categorias-titulo">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2
                id="categorias-titulo"
                className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl"
              >
                Explora por categoría
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Vista previa: el catálogo todavía no está conectado.
              </p>
            </div>
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              Demostración
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {CATEGORIAS_DEMO.map((categoria) => (
              <div
                key={categoria.nombre}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-center shadow-sm shadow-slate-200/50 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {categoria.imagen ? (
                  <img
                    src={categoria.imagen}
                    alt=""
                    className="h-24 w-full object-cover transition duration-300 group-hover:scale-105 sm:h-28"
                  />
                ) : (
                  <span className="flex h-24 items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 text-blue-700 sm:h-28">
                    <IconoCategoria tipo={categoria.icono} />
                  </span>
                )}
                <span className="block px-2 py-3 text-sm font-semibold text-slate-800">
                  {categoria.nombre}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="inspiracion-titulo">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                Ideas para tu próximo pedido
              </p>
              <h2
                id="inspiracion-titulo"
                className="mt-1 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl"
              >
                Inspiración gastronómica
              </h2>
            </div>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
              Solo demostración · no disponible para compra
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {COMIDAS_DEMO.map((comida) => (
              <article
                key={comida.nombre}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50"
              >
                <img
                  src={comida.imagen}
                  alt={comida.alt}
                  loading="lazy"
                  className="h-32 w-full object-cover sm:h-36"
                />
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-slate-800">
                    {comida.nombre}
                  </h3>
                  <p className="mt-1 text-[11px] leading-4 text-slate-500">
                    Imagen de referencia
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="promociones-titulo"
          className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50 p-6 shadow-sm shadow-slate-200/70 sm:p-8">
            <div className="absolute -right-10 -top-14 h-48 w-48 rounded-full bg-blue-200/40 blur-3xl" />
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                Novedades
              </p>
              <h2
                id="promociones-titulo"
                className="mt-2 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl"
              >
                Promociones
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">
                Las promociones aparecerán aquí cuando haya ofertas disponibles.
              </p>
              <div className="mt-5 inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-500">
                Sin promociones publicadas
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  Tu actividad
                </p>
                <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                  Tus pedidos
                </h2>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 5h16v15H4zM8 9h8M8 13h8M8 17h5"
                  />
                </svg>
              </span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">Total</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">
                  {pedidos.length}
                </p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4">
                <p className="text-xs font-medium text-amber-800">Pendientes</p>
                <p className="mt-1 text-2xl font-bold text-amber-700">
                  {pedidos.filter((pedido) => pedido.estado === 'PENDIENTE').length}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="crear-pedido"
          className="scroll-mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70"
        >
          <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
            <h2 className="text-lg font-bold tracking-tight text-slate-950 sm:text-xl">
              Registrar un pedido
            </h2>
            <p className="mt-1.5 text-sm leading-5 text-slate-600">
              Completa los datos para registrar una nueva entrega.
            </p>
          </div>

          <div className="p-5 sm:p-7">
            <FormularioPedido
              cliente={cliente}
              setCliente={setCliente}
              direccion={direccion}
              setDireccion={setDireccion}
              descripcion={descripcion}
              setDescripcion={setDescripcion}
              ubicacionPendiente={ubicacionPendiente}
              ubicacionConfirmada={ubicacionConfirmada}
              setUbicacionPendiente={setUbicacionPendiente}
              confirmarUbicacion={setUbicacionConfirmada}
              crearPedido={crearPedido}
              mensaje={mensaje}
              setMensaje={setMensaje}
            />
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

        <section
          id="mis-pedidos"
          className="scroll-mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70"
        >
          <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
            <h2 className="text-lg font-bold tracking-tight text-slate-950 sm:text-xl">
              Mis pedidos
            </h2>
            <p className="mt-1.5 text-sm leading-5 text-slate-600">
              Consulta y revisa el estado de tus entregas.
            </p>
          </div>

          <div className="p-5 sm:p-7">
            {cargando ? (
              <p className="text-sm text-slate-500">Cargando pedidos...</p>
            ) : (
              <ListaPedidos
                pedidos={pedidos}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

export default PortalCliente
