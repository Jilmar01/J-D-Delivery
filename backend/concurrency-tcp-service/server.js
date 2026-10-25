// =============================================================================
// SERVIDOR TCP DE CHAT - J&D DELIVERY
// Comunicación en tiempo real entre Cliente y Repartidor
// =============================================================================
const net = require('net');

// Configuración de puerto y host
const PORT = process.env.TCP_PORT || 12345;
const HOST = '0.0.0.0'; // Permite conexiones locales y desde otras PCs en la red

// Mapa para almacenar los usuarios conectados: socket -> { nombre, rol }
const clientes = new Map();

// Función para reenviar un mensaje a todos los clientes excepto al emisor
function broadcast(mensaje, emisor) {
    for (const [socket] of clientes) {
        if (socket !== emisor && !socket.destroyed) {
            socket.write(mensaje + '\n');
        }
    }
}

// Crear el servidor TCP
const server = net.createServer((socket) => {
    const remote = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`\n[NUEVA CONEXIÓN] Conexión entrante desde ${remote}`);

    // Manejo de datos recibidos del socket
    socket.on('data', (data) => {
        const texto = data.toString().trim();
        if (!texto) return;

        // Si el cliente aún no está registrado
        if (!clientes.has(socket)) {
            let rol = 'CLIENTE';
            let nombre = 'Usuario';

            // Protocolo de registro: "REGISTRO|ROL|NOMBRE" o texto libre
            if (texto.startsWith('REGISTRO|')) {
                const partes = texto.split('|');
                rol = (partes[1] || 'CLIENTE').toUpperCase();
                nombre = (partes[2] || 'Usuario').trim();
            } else if (texto.includes(':')) {
                const partes = texto.split(':');
                rol = partes[0].toUpperCase().includes('REPART') ? 'REPARTIDOR' : 'CLIENTE';
                nombre = partes.slice(1).join(':').trim();
            } else {
                nombre = texto;
            }

            // Guardar usuario en el Map
            clientes.set(socket, { nombre, rol, remote });

            console.log(`👤 [REGISTRADO] [${rol}] ${nombre} conectado desde ${remote}`);
            
            // Confirmación al cliente conectado
            socket.write(`✅ Bienvenido al chat de J&D Delivery, [${rol}] ${nombre}.\n`);
            
            // Notificar a todos los demás participantes
            broadcast(`📢 [${rol}] ${nombre} se ha unido al chat.`, socket);
            return;
        }

        // Obtener datos del usuario emisor
        const usuario = clientes.get(socket);
        const { nombre, rol } = usuario;

        // Comando para desconectarse
        if (texto.toLowerCase() === 'salir') {
            console.log(`🚪 [SALIDA] [${rol}] ${nombre} ha cerrado su sesión.`);
            socket.write('👋 Has salido del chat. Hasta pronto!\n');
            broadcast(`📢 [${rol}] ${nombre} ha salido del chat.`, socket);
            clientes.delete(socket);
            socket.end();
            return;
        }

        // Mostrar el mensaje en la consola del servidor central
        console.log(`💬 [${rol}] ${nombre}: ${texto}`);

        // Reenviar el mensaje formateado a todos los demás usuarios
        broadcast(`[${rol}] ${nombre}: ${texto}`, socket);
    });

    // Evento al desconectarse el socket
    socket.on('close', () => {
        if (clientes.has(socket)) {
            const usuario = clientes.get(socket);
            clientes.delete(socket);
            console.log(`❌ [DESCONEXIÓN] [${usuario.rol}] ${usuario.nombre} se ha desconectado.`);
            broadcast(`📢 [${usuario.rol}] ${usuario.nombre} ha salido del chat.`, socket);
        }
    });

    // Control de errores de red (evita caídas por cierres abruptos o ECONNRESET)
    socket.on('error', (err) => {
        if (err.code !== 'ECONNRESET') {
            console.error(`⚠️ Error en socket (${remote}):`, err.message);
        }
    });
});

// Iniciar el servidor
server.listen(PORT, HOST, () => {
    console.log('========================================================');
    console.log(`🚀 Servidor TCP de Chat escuchando en ${HOST}:${PORT}`);
    console.log('========================================================');
    console.log('Esperando que se conecten Clientes y Repartidores...\n');
});
