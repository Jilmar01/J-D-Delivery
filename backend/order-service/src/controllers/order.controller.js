import * as orderService from "../services/order.service.js";
import { successResponse, errorResponse } from "../utils/response.js";

const handleError = (res, error, operation) => {
  console.error(`${operation}:`, error);

  const statusCode = error.status || 500;

  const msgError =
    statusCode >= 500
      ? "Error interno del servidor"
      : error.message;

  return errorResponse(res, operation, msgError, statusCode);
};

// POST /api/orders
export const createOrder = async (req, res) => {
  try {
    const order = await orderService.createOrder(req.body);

    return successResponse(
      res,
      "Pedido creado correctamente",
      order,
      201
    );
  } catch (error) {
    return handleError(res, error, "Error al crear pedido");
  }
};

// GET /api/orders
export const getAllOrders = async (req, res) => {
  try {
    const orders = await orderService.getAllOrders();

    return successResponse(
      res,
      "Pedidos consultados correctamente",
      orders,
      200,
      { total: orders.length }
    );
  } catch (error) {
    return handleError(
      res,
      error,
      "Error al consultar pedidos"
    );
  }
};

// GET /api/orders/:id
export const getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id);

    return successResponse(
      res,
      "Pedido consultado correctamente",
      order
    );
  } catch (error) {
    return handleError(res, error, "Error al consultar pedido");
  }
};

// PATCH /api/orders/:id/status
export const updateOrderStatus = async (req, res) => {
  try {
    const { estado } = req.body;

    const order = await orderService.updateOrderStatus(
      req.params.id,
      estado
    );

    return successResponse(
      res,
      "Estado del pedido actualizado correctamente",
      order
    );
  } catch (error) {
    return handleError(
      res,
      error,
      "Error al actualizar estado del pedido"
    );
  }
};

// GET /api/orders/status
export const getOrdersByStatus = async (req, res) => {
  try {
    const orders = await orderService.getOrdersByStatus(req.query.status);

    return successResponse(
      res,
      "Pedidos consultados por estado correctamente",
      orders,
      200,
      { total: orders.length }
    );
  } catch (error) {
    return handleError(
      res,
      error,
      "Error al consultar pedidos por estado"
    );
  }
};