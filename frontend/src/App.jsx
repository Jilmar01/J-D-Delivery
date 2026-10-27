
import { useState } from 'react'
import Login from './Login'
import EncabezadoApp from './components/EncabezadoApp'
import PortalCliente from './components/PortalCliente'
import PanelRepartidor from './components/PanelRepartidor'

function VistaPorRol({ usuario }) {
  switch (usuario.rol) {
    case 'CLIENTE':
      return <PortalCliente usuario={usuario} />
    case 'REPARTIDOR':
      return <PanelRepartidor usuario={usuario} />
    default:
      return (
        <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <p
            role="alert"
            className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
          >
            Tu rol ({usuario.rol}) no tiene una vista disponible.
          </p>
        </main>
      )
  }
}

function App() {
  const [usuario, setUsuario] = useState(null)

  if (!usuario) {
    return <Login alIniciarSesion={setUsuario} />
  }

  return (
    <div
      className={`min-h-screen ${
        usuario.rol === 'CLIENTE'
          ? 'bg-slate-50 text-slate-900'
          : 'bg-[#09090B] text-zinc-100'
      }`}
    >
      <EncabezadoApp
        usuario={usuario}
        alCerrarSesion={() => setUsuario(null)}
      />

      {usuario.modoDemostracion && (
        <p
          role="status"
          className="border-b border-amber-500/20 bg-amber-500/10 px-5 py-3 text-center text-sm text-amber-300"
        >
          Modo demostración local: los datos no se guardan en el backend.
        </p>
      )}

      <VistaPorRol usuario={usuario} />

      <footer
        className={`border-t px-5 py-6 text-center text-xs ${
          usuario.rol === 'CLIENTE'
            ? 'border-slate-200 bg-slate-50 text-slate-500'
            : 'border-white/10 text-zinc-500'
        }`}
      >
        © {new Date().getFullYear()} J-D Delivery · Sistema distribuido de gestión de pedidos y entregas
      </footer>
    </div>
  )
}

export default App
