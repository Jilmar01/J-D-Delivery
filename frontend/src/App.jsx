
import { useEffect, useState } from 'react'
import FormularioPedido from './components/FormularioPedido'
import ListaPedidos from './components/ListaPedidos'
import { obtenerPedidos, crearPedido as guardarPedido } from './services/pedidosService'

function App() {
  const [pedidos, setPedidos] = useState([])
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

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {cargando ? (
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-slate-500">Cargando pedidos...</p>
          </section>
        ) : (
          <ListaPedidos
            pedidos={pedidos}
            actualizarEstado={actualizarEstado}
            colorEstado={colorEstado}
          />
        )}
      </main>

      <footer className="px-5 py-6 text-center text-sm text-slate-500">
        J-D Delivery · Sistema distribuido de gestión de pedidos y entregas
      </footer>
    </div>
  )
}

export default App
