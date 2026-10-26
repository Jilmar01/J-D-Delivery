// =============================================================================
// PROTOCOLO TCP J&D DELIVERY  (BE2-07)
//
// Formato: un mensaje JSON por línea, terminado en "\n" (NDJSON).
// TCP es un flujo de bytes: una lectura puede traer medio mensaje o varios, por eso
// el receptor acumula datos y procesa solo las líneas completas.
//
// SOLICITUDES
//   {"tipo":"ASIGNAR_PEDIDO","pedidoId":1,"repartidorId":7}
//   {"tipo":"CONSULTAR_PEDIDO","pedidoId":1}
//   {"tipo":"PEDIDO_ASIGNADO","pedidoId":1,"repartidorId":7}   <- cualquier evento
//        (PEDIDO_CREADO, PEDIDO_ACTUALIZADO, ...): el servidor lo registra y confirma
//
// RESPUESTAS
//   {"tipo":"ASIGNACION_OK","pedidoId":1,"repartidorId":7,"estado":"ASIGNADO"}
//   {"tipo":"ASIGNACION_RECHAZADA","pedidoId":1,"motivo":"YA_ASIGNADO"}
//        motivo: YA_ASIGNADO | NO_ENCONTRADO | ESTADO_INVALIDO
//   {"tipo":"PEDIDO","pedido":{"id":1,"estado":"ASIGNADO","repartidorId":7}}
//   {"tipo":"ACK","evento":"PEDIDO_ASIGNADO"}
//   {"tipo":"ERROR","motivo":"JSON_INVALIDO" | "CAMPOS_INVALIDOS" | "INTERNO","detalle":"..."}
// =============================================================================

// Pedido.id es SERIAL (INTEGER de 4 bytes): un valor mayor haría fallar a PostgreSQL
const MAX_PEDIDO_ID = 2147483647;
const esPedidoIdValido = (v) => Number.isSafeInteger(v) && v > 0 && v <= MAX_PEDIDO_ID;
const esIdValido = (v) => Number.isSafeInteger(v) && v > 0;

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
    } else if (mensaje.tipo === 'CONSULTAR_PEDIDO') {
        if (!esPedidoIdValido(mensaje.pedidoId)) {
            return { error: { motivo: 'CAMPOS_INVALIDOS', detalle: 'pedidoId debe ser un entero positivo' } };
        }
    }
    return { mensaje };
}

const serializar = (obj) => JSON.stringify(obj) + '\n';

module.exports = { parsearMensaje, serializar };
