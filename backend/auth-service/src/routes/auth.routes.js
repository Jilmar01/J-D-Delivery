import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/database.js";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (
      typeof correo !== "string" ||
      typeof password !== "string" ||
      !correo.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Correo y contraseña son obligatorios",
      });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { correo: correo.trim().toLowerCase() },
    });

    if (!usuario || !(await bcrypt.compare(password, usuario.password))) {
      return res.status(401).json({
        success: false,
        message: "Credenciales incorrectas",
      });
    }

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.status(200).json({
      success: true,
      message: "Inicio de sesión exitoso",
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);

    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
});

export default router;