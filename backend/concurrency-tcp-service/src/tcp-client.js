// =============================================================================
// CLIENTE TCP PROGRAMÁTICO - J&D DELIVERY  (BE2-06)
// Proceso independiente que envía un mensaje JSON al servidor TCP y devuelve la
// respuesta. Funciona en la misma PC o en otra (TCP_HOST = IP del servidor).
// =============================================================================
const net = require('net');

function enviarMensaje(mensaje, { host = process.env.TCP_HOST || 'localhost', port = process.env.TCP_PORT || 12345, timeoutMs = 5000 } = {}) {
    return new Promise((resolve, reject) => {
        const socket = net.connect(Number(port), host);
        let buffer = '';
        socket.setTimeout(timeoutMs, () => {
            socket.destroy();
            reject(new Error(`Tiempo de espera agotado conectando a ${host}:${port}`));
        });
        socket.on('connect', () => socket.write(JSON.stringify(mensaje) + '\n'));
        socket.on('data', (d) => {
            buffer += d.toString();
            const fin = buffer.indexOf('\n');
            if (fin !== -1) {
                socket.end();
                try {
                    resolve(JSON.parse(buffer.slice(0, fin)));
                } catch {
                    reject(new Error('Respuesta no válida del servidor: ' + buffer.slice(0, fin)));
                }
            }
        });
        socket.on('error', reject);
    });
}

module.exports = { enviarMensaje };

if (require.main === module) {
    const [tipo, ...args] = process.argv.slice(2);
    const num = (v) => (v === undefined ? undefined : Number(v));
    let mensaje;
    if (tipo === 'ASIGNAR_PEDIDO') mensaje = { tipo, pedidoId: num(args[0]), repartidorId: num(args[1]) };
    else if (tipo === 'CONSULTAR_PEDIDO') mensaje = { tipo, pedidoId: num(args[0]) };
    else if (tipo === 'NUEVO_PEDIDO') mensaje = { tipo, pedidoId: num(args[0]), lat: num(args[1]), lng: num(args[2]), direccion: args[3] };
    else if (tipo === 'EVENTO') mensaje = { tipo: args[0], pedidoId: num(args[1]), repartidorId: num(args[2]) };

    if (!mensaje) {
        console.error('Uso: node src/tcp-client.js ASIGNAR_PEDIDO <pedidoId> <repartidorId>\n' +
            '     node src/tcp-client.js CONSULTAR_PEDIDO <pedidoId>\n' +
            '     node src/tcp-client.js NUEVO_PEDIDO <pedidoId> <lat> <lng> [direccion]\n' +
            '     node src/tcp-client.js EVENTO <TIPO> <pedidoId> [repartidorId]');
        process.exit(1);
    }
    enviarMensaje(mensaje)
        .then((r) => console.log(JSON.stringify(r)))
        .catch((e) => { console.error('Error:', e.message); process.exit(1); });
}
