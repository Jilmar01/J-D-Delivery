
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || ''

async function solicitarAuth(ruta, opciones) {
  try {
    return await fetch(`${AUTH_API_URL}/api/auth/${ruta}`, opciones)
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        'No se pudo conectar con autenticación. Verifica que el servicio configurado esté activo.',
        { cause: error }
      )
    }

    throw error
  }
}

async function leerRespuesta(respuesta, mensajePorDefecto) {
  let datos = {}

  try {
    datos = await respuesta.json()
  } catch (error) {
    if (respuesta.ok) {
      throw new Error('El servidor de autenticación devolvió una respuesta inválida.', {
        cause: error,
      })
    }
  }

  if (!respuesta.ok) {
    if (respuesta.status >= 500) {
      throw new Error(
        `El servicio de autenticación no está disponible (HTTP ${respuesta.status}). Verifica que el backend esté activo.`
      )
    }

    throw new Error(datos.message || mensajePorDefecto)
  }

  return datos
}

export async function registrarUsuario({ usuario, correo, contrasena, rol }) {
  if (
    typeof usuario !== 'string' ||
    !usuario.trim() ||
    typeof correo !== 'string' ||
    !correo.trim() ||
    typeof contrasena !== 'string' ||
    !contrasena
  ) {
    throw new Error('Completa todos los campos.')
  }

  if (contrasena.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres.')
  }

  if (!['CLIENTE', 'REPARTIDOR'].includes(rol)) {
    throw new Error('El tipo de cuenta no es válido.')
  }

  const respuesta = await solicitarAuth('register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      usuario,
      correo,
      password: contrasena,
      rol,
    }),
  })

  return leerRespuesta(
    respuesta,
    'No se pudo crear la cuenta. Verifica tus datos.'
  )
}

export async function iniciarSesion(correo, contrasena) {
  if (!correo || !contrasena) {
    throw new Error('Ingresa tu correo y contraseña.')
  }

  const respuesta = await solicitarAuth('login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      correo,
      password: contrasena,
    }),
  })

  const datos = await leerRespuesta(
    respuesta,
    'No se pudo iniciar sesión. Verifica tus datos.'
  )

  const usuario = datos.usuario || datos.data?.usuario || datos.data

  if (!usuario || !usuario.rol) {
    throw new Error(
      'El servidor respondió, pero no se encontró el rol del usuario.'
    )
  }

  if (typeof datos.token !== 'string' || !datos.token) {
    throw new Error(
      'El servidor respondió, pero no se encontró el token de autenticación.'
    )
  }

  return {
    ...usuario,
    rol: String(usuario.rol).trim().toUpperCase(),
    token: datos.token,
  }
}
