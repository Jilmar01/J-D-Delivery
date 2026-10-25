
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3003'

/**
 * Servicio de autenticación de J-D Delivery.
 * Se conectará al microservicio auth-service.
 *
 * IMPORTANTE:
 * El backend actual todavía no tiene una ruta de inicio de sesión.
 * Por eso, esta función no simula ni inventa una autenticación exitosa.
 */

export async function iniciarSesion(correo, contrasena) {
  if (!correo || !contrasena) {
    throw new Error('Ingresa tu correo y contraseña.')
  }

  const respuesta = await fetch(`${AUTH_API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ correo, contrasena }),
  })

  const datos = await respuesta.json().catch(() => ({}))

  if (!respuesta.ok) {
    throw new Error(
      datos.message || 'No se pudo iniciar sesión. Verifica tus datos.'
    )
  }

  if (!datos.usuario || !datos.usuario.rol) {
    throw new Error('La respuesta del servidor no contiene el rol del usuario.')
  }

  return datos.usuario
}
