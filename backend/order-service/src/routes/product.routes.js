import { Router } from "express";

import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  updateProductStock,
  deleteProduct,
} from "../controllers/product.controller.js";

const router = Router();

// Endpoint /api/products

// Crear producto
router.post("/", createProduct);

// Listar productos
router.get("/", getAllProducts);

// Obtener productos por ID
router.get("/:id", getProductById);

// Actualizar producto
router.put("/:id", updateProduct);

// Actualizar stock
router.patch("/:id/stock", updateProductStock);

// Eliminar producto
router.delete("/:id", deleteProduct);

export default router;