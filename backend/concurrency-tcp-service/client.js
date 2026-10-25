// =============================================================================
// CLIENTE TCP DE CHAT - J&D DELIVERY
// Permite conectarse como Cliente o como Repartidor
// =============================================================================
const net = require('net');
const readline = require('readline');

// Configuración de puerto y host
const CONNECTION_PORT = process.env.TCP_PORT || 12345;
const HOST = process.env.TCP_HOST || 'localhost';

const cliente = new net.Socket();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Estados del flujo inicial: 'PIDIENDO_ROL' -> 'PIDIENDO_NOMBRE' -> 'CHAT'
let estado = 'PIDIENDO_ROL';
let rol = '';
let nombre = '';

// Conectar al servidor TCP
cliente.connect(CONNECTION_PORT, HOST, () => {
    console.log('====================================================');
    console.log(`🚀 Conectado al Servidor TCP en ${HOST}:${CONNECTION_PORT}`);
    console.log('====================================================\n');
    console.log('Selecciona tu rol:');
    console.log('  1. Cliente');
    console.log('  2. Repartidor');
    process.stdout.write('Elige una opción (1 o 2): ');
});

// Captura de entradas de consola
rl.on('line', (line) => {
    const input = line.trim();

    // Paso 1: Elegir el Rol
    if (estado === 'PIDIENDO_ROL') {
        if (input === '1' || input.toLowerCase() === 'cliente') {
            rol = 'CLIENTE';
        } else if (input === '2' || input.toLowerCase() === 'repartidor') {
            rol = 'REPARTIDOR';
        } else {
            console.log('❌ Opción inválida. Por favor ingresa 1 (Cliente) o 2 (Repartidor):');
            process.stdout.write('> ');
            return;
        }

        estado = 'PIDIENDO_NOMBRE';
        console.log(`\n✅ Rol seleccionado: [${rol}]`);
        process.stdout.write('Ingresa tu nombre de usuario: ');
        return;
    }

    // Paso 2: Ingresar el Nombre
    if (estado === 'PIDIENDO_NOMBRE') {
        if (!input) {
            process.stdout.write('El nombre no puede estar vacío. Ingresa tu nombre: ');
            return;
        }
        nombre = input;
        estado = 'CHAT';

        // Enviar paquete de registro al servidor TCP
        cliente.write(`REGISTRO|${rol}|${nombre}\n`);

        console.log(`\n====================================================`);
        console.log(`💬 Chat activo como [${rol}] ${nombre}`);
        console.log(`   (Escribe tus mensajes y presiona Enter)`);
        console.log(`   (Escribe 'salir' para cerrar la conexión)`);
        console.log(`====================================================\n`);
        return;
    }

    // Paso 3: Chat en tiempo real
    if (estado === 'CHAT') {
        if (!input) return;

        // Enviar el mensaje al servidor TCP
        cliente.write(input + '\n');

        // Si escribe 'salir', cerrar conexión
        if (input.toLowerCase() === 'salir') {
            rl.close();
            cliente.end();
            return;
        }

        // Reemplazar la línea tipeada en consola para mostrar el prefijo [YO]
        readline.moveCursor(process.stdout, 0, -1);
        readline.clearLine(process.stdout, 0);
        console.log(`[YO (${rol})]: ${input}`);
    }
});

// Mensajes entrantes desde el servidor TCP
cliente.on('data', (data) => {
    const texto = data.toString().trim();
    if (texto) {
        console.log(texto);
    }
});

// Evento de cierre de conexión
cliente.on('close', () => {
    console.log('\n[INFO] Conexión cerrada con el servidor.');
    process.exit(0);
});

// Control de errores de conexión
cliente.on('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
        console.error(`\n❌ [ERROR] No se pudo conectar al servidor en ${HOST}:${CONNECTION_PORT}.`);
        console.error('Asegúrate de haber iniciado primero el servidor con: node server.js\n');
    } else {
        console.error('\n⚠️ [ERROR]:', err.message);
    }
    process.exit(1);
});
