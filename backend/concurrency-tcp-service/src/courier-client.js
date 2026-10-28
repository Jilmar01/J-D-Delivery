// =============================================================================
// CLIENTE DE REPARTIDOR TCP - J&D DELIVERY
// Proceso independiente que mantiene una conexión abierta con el servidor TCP:
// se registra con su ubicación, la actualiza cada 10 s y recibe ofertas de pedidos.
// Funciona en la misma PC o en otra (TCP_HOST = IP del servidor).
// =============================================================================
const net = require('net');
const readline = require('readline');

const [idArg, latArg, lngArg, flag] = process.argv.slice(2);
const repartidorId = Number(idArg);
const lat = Number(latArg);
const lng = Number(lngArg);
const auto = flag === '--auto';

if (!Number.isSafeInteger(repartidorId) || repartidorId <= 0 || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    console.error('Uso: node src/courier-client.js <repartidorId> <lat> <lng> [--auto]');
    process.exit(1);
}

const host = process.env.TCP_HOST || 'localhost';
const port = Number(process.env.TCP_PORT || 12345);
const socket = net.connect(port, host);
const enviar = (obj) => socket.write(JSON.stringify(obj) + '\n');
let ofertaActual = null;

socket.on('connect', () => {
    console.log(`🛵 Repartidor ${repartidorId} conectado a ${host}:${port}`);
    enviar({ tipo: 'REGISTRAR_REPARTIDOR', repartidorId, lat, lng });
    setInterval(() => enviar({ tipo: 'ACTUALIZAR_UBICACION', repartidorId, lat, lng }), 10000).unref();
});

let buffer = '';
socket.on('data', (d) => {
    buffer += d.toString();
    const lineas = buffer.split('\n');
    buffer = lineas.pop();
    for (const linea of lineas.filter(Boolean)) manejar(JSON.parse(linea));
});

function manejar(m) {
    if (m.tipo === 'OFERTA_PEDIDO') {
        ofertaActual = m.pedidoId;
        console.log(`📍 OFERTA pedido ${m.pedidoId}: ${m.direccion || '(sin dirección)'} a ${m.distanciaKm} km (expira ${m.expiraEn})`);
        if (auto) setTimeout(() => enviar({ tipo: 'ACEPTAR_PEDIDO', pedidoId: m.pedidoId, repartidorId }), 500);
        else console.log('   Escribe "a" para aceptar o "r" para rechazar');
    } else if (m.tipo === 'PEDIDO_TOMADO' || m.tipo === 'OFERTA_EXPIRADA') {
        console.log(`⏹️  ${m.tipo} pedido ${m.pedidoId}`);
        if (ofertaActual === m.pedidoId) ofertaActual = null;
    } else {
        console.log('←', JSON.stringify(m));
    }
}

if (!auto) {
    readline.createInterface({ input: process.stdin }).on('line', (l) => {
        if (ofertaActual === null) return console.log('No hay oferta vigente');
        const tipo = l.trim().toLowerCase() === 'a' ? 'ACEPTAR_PEDIDO' : l.trim().toLowerCase() === 'r' ? 'RECHAZAR_PEDIDO' : null;
        if (!tipo) return console.log('Escribe "a" o "r"');
        enviar({ tipo, pedidoId: ofertaActual, repartidorId });
        ofertaActual = null;
    });
}

socket.on('error', (e) => { console.error('Error:', e.message); process.exit(1); });
socket.on('close', () => { console.log('Conexión cerrada'); process.exit(0); });
