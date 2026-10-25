
import { useEffect, useState } from 'react'
import Login from './Login'
import FormularioPedido from './components/FormularioPedido'
import ListaPedidos from './components/ListaPedidos'
import {
  obtenerPedidos,
  crearPedido as guardarPedido,
} from './services/pedidosService'

function App() {
  const [pedidos, setPedidos] = useState([])
  const [usuario, setUsuario] = useState(null)
  const [cliente, setCliente] = useState('')
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
      setCliente('')
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
        pedido.id === id
          ? { ...pedido, estado: nuevoEstado }
          : pedido
      )
    )
  }

  function colorEstado(estado) {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20'
      case 'ASIGNADO':
        return 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20'
      case 'EN_CAMINO':
        return 'bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20'
      case 'ENTREGADO':
        return 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
      case 'CANCELADO':
        return 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'
      default:
        return 'bg-zinc-700 text-zinc-300'
    }
  }

  if (!usuario) {
    return <Login alIniciarSesion={setUsuario} />
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#111113]/95 shadow-xl shadow-black/20 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-7 w-7 text-white"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 7h11v11H3zM14 11h4l3 3v4h-7z"
                />
                <circle cx="7.5" cy="18" r="1.5" />
                <circle cx="17.5" cy="18" r="1.5" />
              </svg>
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                J-D <span className="text-blue-500">Delivery</span>
              </h1>
              <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
                Sistema de gestión de pedidos y entregas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-400 sm:inline-flex">
              Portal del cliente
            </span>

            <button
              type="button"
              onClick={() => {
                setUsuario(null)
                setMensaje('')
                setError('')
              }}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-blue-500/50 hover:bg-zinc-700 hover:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/20"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-5 py-8 sm:px-8 sm:py-10">
        <section className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-950/70 via-[#15151A] to-[#15151A] p-6 sm:p-8">
          <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-blue-600/10 blur-3xl" />

          <div className="relative">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              Panel principal
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              ¡Bienvenido a J-D Delivery!
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
              Registra tus pedidos, consulta su estado y mantén organizada
              la información de tus entregas desde un solo lugar.
            </p>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-[#18181B] p-5 shadow-lg shadow-black/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total de pedidos</p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {pedidos.length}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6 text-blue-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 7h18v14H3zM7 7V4h10v3M8 12h8M8 16h5"
                  />
                </svg>
              </div>
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              Pedidos registrados en esta sesión de la aplicación.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#18181B] p-5 shadow-lg shadow-black/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Pedidos pendientes</p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {pedidos.filter((pedido) => pedido.estado === 'PENDIENTE').length}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6 text-amber-400"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 7v5l3 2"
                  />
                </svg>
              </div>
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              Pedidos que todavía están esperando atención.
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#18181B] shadow-xl shadow-black/10">
          <div className="border-b border-white/10 px-5 py-5 sm:px-7">
            <h2 className="text-lg font-bold text-white sm:text-xl">
              Registrar un pedido
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
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
            className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
          >
            {error}
          </p>
        )}

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#18181B] shadow-xl shadow-black/10">
          <div className="border-b border-white/10 px-5 py-5 sm:px-7">
            <h2 className="text-lg font-bold text-white sm:text-xl">
              Mis pedidos
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Consulta y revisa el estado de tus entregas.
            </p>
          </div>

          <div className="p-5 sm:p-7">
            {cargando ? (
              <p className="text-sm text-zinc-400">
                Cargando pedidos...
              </p>
            ) : (
              <ListaPedidos
                pedidos={pedidos}
                actualizarEstado={actualizarEstado}
                colorEstado={colorEstado}
              />
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-5 py-6 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} J-D Delivery · Sistema distribuido de gestión de pedidos y entregas
      </footer>
    </div>
  )
}

export default App
