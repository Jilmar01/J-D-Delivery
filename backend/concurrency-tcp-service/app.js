// =============================================================================
// SERVIDOR TCP PRUEBA - J&D DELIVERY
// Servidor de prueba para verificar conexiones de clientes TCP
// =============================================================================
const net = require('net');

const PORT = process.env.TCP_PORT || 12345;
const HOST = '0.0.0.0'; // Permite conexiones locales y remotas

function crearServidor() {
  return net.createServer((socket) => {
    const clienteRemote = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`\n✅ [NUEVA CONEXIÓN] Cliente conectado desde: ${clienteRemote}`);

    let buffer = '';

    // Escuchar datos enviados por el cliente
    socket.on('data', (data) => {
      buffer += data.toString();
      const lineas = buffer.split('\n');
      buffer = lineas.pop(); // Mantiene fragmentos incompletos en el buffer

      for (const linea of lineas) {
        const mensaje = linea.trim();
        if (!mensaje) continue;

        console.log(`📩 [MENSAJE RECIBIDO de ${clienteRemote}]:`, mensaje);

        // Responder un ACK o eco de confirmación al cliente
        const respuesta = JSON.stringify({
          tipo: 'ACK',
          estado: 'CONECTADO_Y_RECIBIDO',
          mensajeRecibido: mensaje,
        }) + '\n';

        socket.write(respuesta);
      }
    });

    // Detectar desconexión del cliente
    socket.on('end', () => {
      console.log(`❌ [DESCONECTADO] El cliente ${clienteRemote} cerró la conexión.`);
    });

    // Evitar caídas del servidor por errores inesperados en el socket
    socket.on('error', (err) => {
      if (err.code !== 'ECONNRESET') {
        console.error(`⚠️ [ERROR SOCKET ${clienteRemote}]:`, err.message);
      } else {
        console.log(`⚠️ [DESCONEXIÓN BRUSCA] El cliente ${clienteRemote} se desconectó repentinamente.`);
      }
    });
  });
}

module.exports = { crearServidor };

if (require.main === module) {
  crearServidor().listen(PORT, HOST, () => {
    console.log('========================================================');
    console.log(`🚀 Servidor TCP de prueba escuchando en ${HOST}:${PORT}`);
    console.log('========================================================\n');
  });
}