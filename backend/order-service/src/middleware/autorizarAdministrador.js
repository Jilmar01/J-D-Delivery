import jwt from "jsonwebtoken";

export function autorizarAdministrador(req, res, next) {
  const [esquema, token] = (req.headers.authorization || "").split(" ");

  if (esquema !== "Bearer" || !token) {
    return res.status(401).json({
      success: false,
      message: "Se requiere iniciar sesión como administrador",
    });
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET no está configurado en order-service.");
    return res.status(500).json({
      success: false,
      message: "La autenticación no está configurada en el servidor",
    });
  }

  try {
    const usuario = jwt.verify(token, process.env.JWT_SECRET);

    if (usuario.rol !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Se requiere el rol de administrador",
      });
    }

    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "La sesión no es válida o ha expirado",
    });
  }
}
