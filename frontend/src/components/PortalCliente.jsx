
import { useEffect, useState } from 'react'
import FormularioPedido from './FormularioPedido'
import ListaPedidos from './ListaPedidos'
import {
  obtenerPedidos,
  crearPedido as guardarPedido,
} from '../services/pedidosService'
import { colorEstado } from '../utils/estados'

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

  return (
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
            Registra tus pedidos, consulta su estado y mantén organizada la
            información de tus entregas desde un solo lugar.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#18181B] p-5 shadow-lg shadow-black/10">
          <p className="text-sm text-zinc-400">Total de pedidos</p>
          <p className="mt-2 text-3xl font-bold text-white">{pedidos.length}</p>
          <p className="mt-3 text-xs text-zinc-500">
            Pedidos registrados en esta sesión de la aplicación.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#18181B] p-5 shadow-lg shadow-black/10">
          <p className="text-sm text-zinc-400">Pedidos pendientes</p>
          <p className="mt-2 text-3xl font-bold text-white">
            {pedidos.filter((pedido) => pedido.estado === 'PENDIENTE').length}
          </p>
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
            <p className="text-sm text-zinc-400">Cargando pedidos...</p>
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
  )
}

export default PortalCliente
