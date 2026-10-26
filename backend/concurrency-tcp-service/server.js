// =============================================================================
// SERVIDOR TCP - J&D DELIVERY
// Recibe mensajes JSON (uno por línea) y asigna pedidos de forma concurrente.
// Formato de mensajes: ver src/protocolo.js
// =============================================================================
const net = require('net');
const { crearStore } = require('./src/asignacion');
const { parsearMensaje, serializar } = require('./src/protocolo');

const PORT = process.env.TCP_PORT || 12345;
const HOST = '0.0.0.0'; // Permite conexiones locales y desde otras PCs en la red

function crearServidor({ store }) {
    // Atiende un mensaje del protocolo y devuelve el objeto de respuesta
    async function procesarMensaje(linea) {
        const { mensaje, error } = parsearMensaje(linea);
        if (error) return { tipo: 'ERROR', ...error };

        if (mensaje.tipo === 'CONSULTAR_PEDIDO') {
            const pedido = await store.consultar(mensaje.pedidoId);
            return pedido
                ? { tipo: 'PEDIDO', pedido }
                : { tipo: 'ERROR', motivo: 'NO_ENCONTRADO', detalle: `Pedido ${mensaje.pedidoId} no existe` };
        }

        if (mensaje.tipo === 'ASIGNAR_PEDIDO') {
            // La protección está en la base de datos (UPDATE atómico), no en Node
            const r = await store.asignar(mensaje.pedidoId, mensaje.repartidorId);
            if (!r.asignado) {
                return { tipo: 'ASIGNACION_RECHAZADA', pedidoId: mensaje.pedidoId, motivo: r.motivo };
            }
            console.log(`📦 [ASIGNADO] Pedido ${r.pedido.id} -> repartidor ${r.pedido.repartidorId}`);
            return { tipo: 'ASIGNACION_OK', pedidoId: r.pedido.id, repartidorId: r.pedido.repartidorId, estado: r.pedido.estado };
        }

        // Cualquier otro tipo es un evento informativo entre procesos: se registra y se confirma
        console.log(`📨 [EVENTO TCP] ${linea}`);
        return { tipo: 'ACK', evento: mensaje.tipo };
    }

    return net.createServer((socket) => {
        const remote = `${socket.remoteAddress}:${socket.remotePort}`;
        console.log(`[CONEXIÓN] ${remote}`);

        // TCP es un flujo: un 'data' puede traer media línea o varias. Se acumula
        // y se procesa por líneas completas (\n).
        let buffer = '';
        // Cadena de promesas por socket: respuestas en el mismo orden que las solicitudes
        let cola = Promise.resolve();

        socket.on('data', (data) => {
            buffer += data.toString();
            const lineas = buffer.split('\n');
            buffer = lineas.pop();

            for (const cruda of lineas) {
                const texto = cruda.trim();
                if (!texto) continue;

                cola = cola.then(async () => {
                    if (socket.destroyed) return;
                    try {
                        socket.write(serializar(await procesarMensaje(texto)));
                    } catch (err) {
                        console.error('⚠️ Error procesando mensaje:', err.message);
                        // El detalle real queda en el log; al cliente no se le expone texto de la base de datos
                        socket.write(serializar({ tipo: 'ERROR', motivo: 'INTERNO', detalle: 'No se pudo procesar la solicitud' }));
                    }
                });
            }
        });

        // Evita caídas por cierres abruptos (ECONNRESET)
        socket.on('error', (err) => {
            if (err.code !== 'ECONNRESET') {
                console.error(`⚠️ Error en socket (${remote}):`, err.message);
            }
        });
    });
}

module.exports = { crearServidor };

if (require.main === module) {
    if (!process.env.DATABASE_URL) {
        console.error('❌ Define DATABASE_URL (PostgreSQL de pedidos) antes de iniciar el servidor.');
        process.exit(1);
    }
    const store = crearStore(process.env.DATABASE_URL);

    store.init().then(() => {
        crearServidor({ store }).listen(PORT, HOST, () => {
            console.log('========================================================');
            console.log(`🚀 Servidor TCP escuchando en ${HOST}:${PORT}`);
            console.log('========================================================\n');
        });
    }).catch((err) => {
        console.error('❌ No se pudo conectar a PostgreSQL:', err.message);
        process.exit(1);
    });
}
