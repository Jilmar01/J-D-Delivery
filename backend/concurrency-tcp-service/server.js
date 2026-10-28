// =============================================================================
// SERVIDOR TCP - J&D DELIVERY
// Recibe mensajes JSON (uno por línea) y asigna pedidos de forma concurrente.
// Formato de mensajes: ver src/protocolo.js
// =============================================================================
const net = require('net');
const { crearStore } = require('./src/asignacion');
const { parsearMensaje, serializar } = require('./src/protocolo');
const { RegistroRepartidores } = require('./src/repartidores');
const { crearOfertas } = require('./src/ofertas');

const PORT = process.env.TCP_PORT || 12345;
const HOST = '0.0.0.0'; // Permite conexiones locales y desde otras PCs en la red

// opciones (todas opcionales): nOfertas, maxKm, timeoutMs, edadMaxMs
function crearServidor({ store, opciones = {} }) {
    const registro = new RegistroRepartidores();
    const ofertas = crearOfertas({ store, registro, ...opciones });

    // Atiende un mensaje del protocolo y devuelve el objeto de respuesta
    async function procesarMensaje(linea, socket) {
        const { mensaje, error } = parsearMensaje(linea);
        if (error) return { tipo: 'ERROR', ...error };

        if (mensaje.tipo === 'REGISTRAR_REPARTIDOR') {
            registro.registrar(mensaje.repartidorId, mensaje.lat, mensaje.lng, socket);
            console.log(`🛵 [REPARTIDOR] ${mensaje.repartidorId} registrado en (${mensaje.lat}, ${mensaje.lng})`);
            return { tipo: 'REGISTRADO', repartidorId: mensaje.repartidorId };
        }

        if (mensaje.tipo === 'ACTUALIZAR_UBICACION') {
            const ok = registro.actualizar(mensaje.repartidorId, mensaje.lat, mensaje.lng, mensaje.disponible);
            return ok
                ? { tipo: 'UBICACION_OK', repartidorId: mensaje.repartidorId }
                : { tipo: 'ERROR', motivo: 'NO_REGISTRADO', detalle: 'Envía REGISTRAR_REPARTIDOR primero' };
        }

        if (mensaje.tipo === 'NUEVO_PEDIDO') {
            const r = ofertas.ofrecer({
                id: mensaje.pedidoId, lat: mensaje.lat, lng: mensaje.lng, direccion: mensaje.direccion,
                entregaLat: mensaje.entregaLat, entregaLng: mensaje.entregaLng,
            });
            if (!r.ok) return { tipo: r.motivo === 'OFERTA_EN_CURSO' ? 'ERROR' : r.motivo, pedidoId: mensaje.pedidoId, motivo: r.motivo };
            console.log(`📍 [OFERTA] Pedido ${mensaje.pedidoId} ofrecido a ${r.repartidores.map((x) => x.repartidorId).join(', ')}`);
            return { tipo: 'OFERTA_ENVIADA', pedidoId: mensaje.pedidoId, repartidores: r.repartidores };
        }

        if (mensaje.tipo === 'ACEPTAR_PEDIDO') {
            const r = await ofertas.aceptar(mensaje.pedidoId, mensaje.repartidorId);
            if (!r.asignado) {
                return { tipo: 'ASIGNACION_RECHAZADA', pedidoId: mensaje.pedidoId, motivo: r.motivo };
            }
            console.log(`📦 [ASIGNADO] Pedido ${r.pedido.id} -> repartidor ${r.pedido.repartidorId}`);
            return { tipo: 'ASIGNACION_OK', pedidoId: r.pedido.id, repartidorId: r.pedido.repartidorId, estado: r.pedido.estado };
        }

        if (mensaje.tipo === 'RECHAZAR_PEDIDO') {
            ofertas.rechazar(mensaje.pedidoId, mensaje.repartidorId);
            return { tipo: 'ACK', evento: mensaje.tipo };
        }

        if (mensaje.tipo === 'CONSULTAR_PEDIDO') {
            const pedido = await store.consultar(mensaje.pedidoId);
            return pedido
                ? { tipo: 'PEDIDO', pedido }
                : { tipo: 'ERROR', motivo: 'NO_ENCONTRADO', detalle: `Pedido ${mensaje.pedidoId} no existe` };
        }

        if (mensaje.tipo === 'ASIGNAR_PEDIDO') {
            // La protección está en la base de datos (transacción con bloqueo por pedido), no en Node
            const r = await store.asignar(mensaje.pedidoId, mensaje.repartidorId, mensaje.direccion);
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

    const servidor = net.createServer((socket) => {
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
                        socket.write(serializar(await procesarMensaje(texto, socket)));
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

        // Un repartidor que se desconecta deja de recibir ofertas
        socket.on('close', () => {
            const repartidorId = registro.quitarPorSocket(socket);
            if (repartidorId !== null) {
                console.log(`🛵 [REPARTIDOR] ${repartidorId} desconectado`);
                ofertas.quitarRepartidor(repartidorId);
            }
        });
    });

    servidor.on('close', () => ofertas.detener());
    return servidor;
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
