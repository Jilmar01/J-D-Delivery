
import { useState } from 'react'
import CampoFormulario, { estiloCampo } from './CampoFormulario'
import { registrarUsuario } from '../services/authService'

function FormularioRegistro({ alRegistrar }) {
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [rol, setRol] = useState('CLIENTE')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function registrar(e) {
    e.preventDefault()
    setError('')

    const usuario = nombre.trim()
    const correoNormalizado = correo.trim().toLowerCase()

    if (!usuario || !correoNormalizado || !contrasena) {
      setError('Completa todos los campos.')
      return
    }

    if (contrasena !== confirmacion) {
      setError('Las contraseñas no coinciden.')
      return
    }

    if (contrasena.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (!['CLIENTE', 'REPARTIDOR'].includes(rol)) {
      setError('Selecciona un tipo de cuenta válido.')
      return
    }

    setCargando(true)

    try {
      await registrarUsuario({
        usuario,
        correo: correoNormalizado,
        contrasena,
        rol,
      })

      alRegistrar(correoNormalizado)
    } catch (err) {
      setError(err.message || 'No se pudo crear la cuenta. Intenta nuevamente.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <form onSubmit={registrar} className="space-y-5">
      <CampoFormulario
        id="nombre"
        etiqueta="Nombre completo"
        type="text"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Ingresa tu nombre"
        autoComplete="name"
        required
      />

      <CampoFormulario
        id="correo-registro"
        etiqueta="Correo electrónico"
        type="email"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
        placeholder="cliente@ejemplo.com"
        autoComplete="username"
        required
      />

      <CampoFormulario
        id="contrasena-registro"
        etiqueta="Contraseña"
        type="password"
        value={contrasena}
        onChange={(e) => setContrasena(e.target.value)}
        placeholder="Mínimo 6 caracteres"
        autoComplete="new-password"
        minLength={6}
        required
      />

      <CampoFormulario
        id="confirmacion"
        etiqueta="Confirmar contraseña"
        type="password"
        value={confirmacion}
        onChange={(e) => setConfirmacion(e.target.value)}
        placeholder="Repite tu contraseña"
        autoComplete="new-password"
        required
      />

      <CampoFormulario id="rol" etiqueta="Tipo de cuenta">
        <select
          id="rol"
          value={rol}
          onChange={(e) => setRol(e.target.value)}
          className={estiloCampo}
        >
          <option value="CLIENTE">Cliente</option>
          <option value="REPARTIDOR">Repartidor</option>
        </select>
      </CampoFormulario>

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
        {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
      </button>
    </form>
  )
}

export default FormularioRegistro
