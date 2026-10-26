
import { useEffect, useState } from 'react'
import FormularioPedido from './FormularioPedido'
import ListaPedidos from './ListaPedidos'
import {
  obtenerPedidos,
  crearPedido as guardarPedido,
} from '../services/pedidosService'

const CATEGORIAS_DEMO = [
  { nombre: 'Restaurantes', icono: '🍽️', color: 'bg-orange-50 text-orange-600' },
  { nombre: 'Súper', icono: '🛒', color: 'bg-emerald-50 text-emerald-600' },
  { nombre: 'Farmacias', icono: '✚', color: 'bg-rose-50 text-rose-600' },
  { nombre: 'Bebidas', icono: '🥤', color: 'bg-cyan-50 text-cyan-700' },
  { nombre: 'Tiendas', icono: '🏪', color: 'bg-violet-50 text-violet-600' },
  { nombre: 'Mascotas', icono: '🐾', color: 'bg-amber-50 text-amber-700' },
]

function PortalCliente({ usuario }) {
  const [pedidos, setPedidos] = useState([])
  const [cliente, setCliente] = useState(usuario.nombre || '')
  const [direccion, setDireccion] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargarPedidos() {
      try {
        const datos = await obtenerPedidos()
        setPedidos(datos)
      } catch {
        setError('No se pudieron cargar los pedidos.')
      } finally {
        setCargando(false)
      }
    }

    cargarPedidos()
  }, [])

  async function crearPedido(e) {
    e.preventDefault()
    setMensaje('')
    setError('')

    try {
      const nuevoPedido = await guardarPedido({
        cliente,
        direccion,
        descripcion,
      })

      setPedidos((anteriores) => [...anteriores, nuevoPedido])
      setCliente(usuario.nombre || '')
      setDireccion('')
      setDescripcion('')
      setMensaje('¡Pedido registrado correctamente!')
    } catch {
      setError('No se pudo registrar el pedido. Intenta nuevamente.')
    }
  }

  function actualizarEstado(id, nuevoEstado) {
    setPedidos((anteriores) =>
      anteriores.map((pedido) =>
        pedido.id === id ? { ...pedido, estado: nuevoEstado } : pedido
      )
    )
  }

  const nombreCorto = usuario.nombre?.trim().split(/\s+/)[0] || 'cliente'

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-7 sm:space-y-10 sm:px-8 sm:py-10">
        <section className="relative isolate min-h-[320px] overflow-hidden rounded-3xl bg-[#07172D] shadow-xl shadow-blue-950/10 sm:min-h-[350px] lg:min-h-[390px]">
          <div className="absolute inset-0 -z-20 bg-gradient-to-br from-[#0B2A50] via-[#0B1D38] to-[#061226]" />
          <img
            src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1600&q=85"
            alt=""
            className="absolute inset-y-0 right-0 -z-10 h-full w-full object-cover object-center opacity-55 sm:w-3/4 sm:opacity-70"
            onError={(evento) => {
              evento.currentTarget.style.display = 'none'
            }}
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#07172D] via-[#07172D]/90 to-[#07172D]/30 sm:to-transparent" />
          <div className="relative flex min-h-[320px] flex-col justify-center p-6 sm:min-h-[350px] sm:p-10 lg:min-h-[390px] lg:p-14">
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
                className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm shadow-slate-200/50"
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${categoria.color}`}
                  aria-hidden="true"
                >
                  {categoria.icono}
                </span>
                <span className="text-sm font-semibold text-slate-800">
                  {categoria.nombre}
                </span>
              </div>
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

        <section aria-labelledby="restaurantes-titulo">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Para ti
            </p>
            <h2
              id="restaurantes-titulo"
              className="mt-1 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl"
            >
              Restaurantes populares
            </h2>
          </div>
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-9 text-center shadow-sm shadow-slate-200/40 sm:py-11">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 10h16l-1 10H5L4 10ZM3 10l2-6h14l2 6M9 14h6"
                />
              </svg>
            </span>
            <p className="mt-4 font-semibold text-slate-800">
              Todavía no hay restaurantes para mostrar.
            </p>
            <p className="mt-1.5 text-sm text-slate-500">
              Cuando el catálogo esté disponible, podrás explorar sus menús aquí.
            </p>
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
                actualizarEstado={actualizarEstado}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

export default PortalCliente
