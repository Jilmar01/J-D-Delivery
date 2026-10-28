import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../config/database.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validar campos obligatorios
    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Usuario, correo y contraseña son obligatorios",
      });
    }

    // Validar rol
    const userRole = role ?? "CUSTOMER";

    if (!["CUSTOMER", "DELIVERY_PERSON"].includes(userRole)) {
      return res.status(400).json({
        success: false,
        message: "El rol debe ser CUSTOMER o DELIVERY_PERSON",
      });
    }

    const usernameClean = username.trim();
    const emailClean = email.trim().toLowerCase();

    // Validar nombre de usuario
    if (usernameClean.length < 3 || usernameClean.length > 50) {
      return res.status(400).json({
        success: false,
        message: "El usuario debe tener entre 3 y 50 caracteres",
      });
    }

    // Validar correo
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
      return res.status(400).json({
        success: false,
        message: "El correo electrónico no es válido",
      });
    }

    // Validar contraseña
    if (
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        success: false,
        message: "La contraseña debe tener al menos 8 caracteres y no superar 72 bytes",
      });
    }

    // Verificar si el correo ya existe
    const existingUser = await prisma.user.findUnique({
      where: {
        email: emailClean,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "El correo ya está registrado",
      });
    }

    // Verificar si el nombre de usuario ya existe
    const existingUsername = await prisma.user.findUnique({
      where: {
        username: usernameClean,
      },
    });

    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: "El nombre de usuario ya está registrado",
      });
    }

    // Encriptar contraseña
    const passwordHash = await bcrypt.hash(password, 12);

    // Crear usuario
    const newUser = await prisma.user.create({
      data: {
        username: usernameClean,
        email: emailClean,
        password: passwordHash,
        role: userRole,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Usuario registrado correctamente",
      data: newUser,
    });
  } catch (error) {
    // Manejar registros duplicados simultáneos
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "El correo o nombre de usuario ya está registrado",
      });
    }

    console.error("Error al registrar usuario:", error);

    return res.status(500).json({
      success: false,
      message: "Error interno al registrar el usuario",
    });
  }
});

export default router;
