
import InsigniaRol from './InsigniaRol'

function EncabezadoApp({ usuario, alCerrarSesion }) {
  const nombre = usuario.nombre || usuario.correo

  return (
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

        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-zinc-100">{nombre}</p>
            {usuario.nombre && (
              <p className="text-xs text-zinc-500">{usuario.correo}</p>
            )}
          </div>

          <span className="hidden sm:inline-flex">
            <InsigniaRol rol={usuario.rol} />
          </span>

          <button
            type="button"
            onClick={alCerrarSesion}
            className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-blue-500/50 hover:bg-zinc-700 hover:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/20"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  )
}

export default EncabezadoApp
