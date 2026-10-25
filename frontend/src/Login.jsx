
import { useState } from 'react'
import { iniciarSesion as autenticarUsuario } from './services/authService'

function Login({ alIniciarSesion }) {
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function iniciarSesion(e) {
    e.preventDefault()
    setError('')
    setCargando(true)

    try {
      const usuario = await autenticarUsuario(
        correo.trim().toLowerCase(),
        contrasena
      )

      alIniciarSesion(usuario)
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión. Intenta nuevamente.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090B] px-4 py-10">
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

      <section className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#18181B] p-8 shadow-2xl shadow-black/40 sm:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-9 w-9"
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

          <h1 className="text-3xl font-bold tracking-tight text-white">
            J-D <span className="text-blue-500">Delivery</span>
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Gestiona tus pedidos de forma rápida y sencilla.
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white">Bienvenido</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Ingresa tus datos para continuar.
          </p>
        </div>

        <form onSubmit={iniciarSesion} className="space-y-5">
          <div>
            <label
              htmlFor="correo"
              className="mb-2 block text-sm font-medium text-zinc-200"
            >
              Correo electrónico
            </label>
            <input
              id="correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="cliente@ejemplo.com"
              autoComplete="username"
              required
              className="w-full rounded-xl border border-zinc-700 bg-[#09090B] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <div>
            <label
              htmlFor="contrasena"
              className="mb-2 block text-sm font-medium text-zinc-200"
            >
              Contraseña
            </label>
            <input
              id="contrasena"
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="Ingresa tu contraseña"
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-zinc-700 bg-[#09090B] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cargando ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="mt-7 text-center text-xs leading-5 text-zinc-500">
          J-D Delivery · Sistema de gestión de pedidos y entregas
        </p>
      </section>
    </main>
  )
}

export default Login
