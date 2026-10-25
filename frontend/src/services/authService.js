
const AUTH_API_URL =
  import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3003'

export async function iniciarSesion(correo, contrasena) {
  if (!correo || !contrasena) {
    throw new Error('Ingresa tu correo y contraseña.')
  }

  const respuesta = await fetch(`${AUTH_API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      correo,
      password: contrasena,
    }),
  })

  const datos = await respuesta.json().catch(() => ({}))

  if (!respuesta.ok) {
    throw new Error(
      datos.message || 'No se pudo iniciar sesión. Verifica tus datos.'
    )
  }

  const usuario = datos.usuario || datos.data?.usuario || datos.data

  if (!usuario || !usuario.rol) {
    throw new Error(
      'El servidor respondió, pero no se encontró el rol del usuario.'
    )
  }

  return {
    ...usuario,
    rol: String(usuario.rol).toUpperCase(),
    token: datos.token,
  }
}
