// =============================================================================
// PROTOCOLO TCP J&D DELIVERY  (BE2-07)
// Formato: un mensaje JSON por línea, terminado en "\n" (NDJSON).
// TCP es un flujo de bytes: una lectura puede traer medio mensaje o varios, por eso
// el receptor acumula datos y procesa solo las líneas completas.
// =============================================================================

// Pedido.id es SERIAL (INTEGER de 4 bytes): un valor mayor haría fallar a PostgreSQL
const MAX_PEDIDO_ID = 2147483647;
const esPedidoIdValido = (v) => Number.isSafeInteger(v) && v > 0 && v <= MAX_PEDIDO_ID;
const esIdValido = (v) => Number.isSafeInteger(v) && v > 0;
const esLatValida = (v) => typeof v === 'number' && Number.isFinite(v) && v >= -90 && v <= 90;
const esLngValida = (v) => typeof v === 'number' && Number.isFinite(v) && v >= -180 && v <= 180;

const invalido = (detalle) => ({ error: { motivo: 'CAMPOS_INVALIDOS', detalle } });

// Devuelve { mensaje } o { error: { motivo, detalle } }
function parsearMensaje(linea) {
    let mensaje;
    try {
        mensaje = JSON.parse(linea);
    } catch {
        return { error: { motivo: 'JSON_INVALIDO', detalle: 'El mensaje no es JSON válido' } };
    }
    if (!mensaje || typeof mensaje !== 'object' || typeof mensaje.tipo !== 'string') {
        return { error: { motivo: 'CAMPOS_INVALIDOS', detalle: 'Falta el campo "tipo"' } };
    }
    if (mensaje.tipo === 'ASIGNAR_PEDIDO') {
        if (!esPedidoIdValido(mensaje.pedidoId) || !esIdValido(mensaje.repartidorId)) {
            return { error: { motivo: 'CAMPOS_INVALIDOS', detalle: 'pedidoId y repartidorId deben ser enteros positivos' } };
        }
        if (mensaje.direccion !== undefined && typeof mensaje.direccion !== 'string') return invalido('direccion debe ser texto');
    } else if (mensaje.tipo === 'CONSULTAR_PEDIDO') {
        if (!esPedidoIdValido(mensaje.pedidoId)) {
            return { error: { motivo: 'CAMPOS_INVALIDOS', detalle: 'pedidoId debe ser un entero positivo' } };
        }
    } else if (mensaje.tipo === 'REGISTRAR_REPARTIDOR' || mensaje.tipo === 'ACTUALIZAR_UBICACION') {
        if (!esIdValido(mensaje.repartidorId)) return invalido('repartidorId debe ser un entero positivo');
        if (!esLatValida(mensaje.lat) || !esLngValida(mensaje.lng)) return invalido('lat y lng deben ser números válidos');
        if (mensaje.disponible !== undefined && typeof mensaje.disponible !== 'boolean') return invalido('disponible debe ser booleano');
    } else if (mensaje.tipo === 'ACEPTAR_PEDIDO' || mensaje.tipo === 'RECHAZAR_PEDIDO') {
        if (!esPedidoIdValido(mensaje.pedidoId) || !esIdValido(mensaje.repartidorId)) {
            return invalido('pedidoId y repartidorId deben ser enteros positivos');
        }
    } else if (mensaje.tipo === 'NUEVO_PEDIDO') {
        if (!esPedidoIdValido(mensaje.pedidoId)) return invalido('pedidoId debe ser un entero positivo');
        if (!esLatValida(mensaje.lat) || !esLngValida(mensaje.lng)) return invalido('lat y lng deben ser números válidos');
        if (mensaje.direccion !== undefined && typeof mensaje.direccion !== 'string') return invalido('direccion debe ser texto');
        // lat/lng = punto de SALIDA (local); entregaLat/entregaLng = punto de entrega, opcional
        if (mensaje.entregaLat !== undefined || mensaje.entregaLng !== undefined) {
            if (!esLatValida(mensaje.entregaLat) || !esLngValida(mensaje.entregaLng)) {
                return invalido('entregaLat y entregaLng deben ser números válidos');
            }
        }
    }
    return { mensaje };
}

const serializar = (obj) => JSON.stringify(obj) + '\n';

module.exports = { parsearMensaje, serializar };
