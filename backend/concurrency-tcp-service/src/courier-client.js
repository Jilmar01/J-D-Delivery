// =============================================================================
// CLIENTE DE REPARTIDOR TCP - J&D DELIVERY
// Proceso independiente que mantiene una conexión abierta con el servidor TCP:
// se registra con su ubicación, la actualiza cada 10 s y recibe ofertas de pedidos.
// =============================================================================
const net = require('net');
const readline = require('readline');

const args = process.argv.slice(2);
const banderas = args.filter((a) => a.startsWith('--'));
const [idArg, latArg, lngArg] = args.filter((a) => !a.startsWith('--'));
const repartidorId = Number(idArg);
let lat = Number(latArg);
let lng = Number(lngArg);
const auto = banderas.includes('--auto');
const moverSolo = banderas.includes('--mover');

const latValida = (v) => Number.isFinite(v) && v >= -90 && v <= 90;
const lngValida = (v) => Number.isFinite(v) && v >= -180 && v <= 180;

if (!Number.isSafeInteger(repartidorId) || repartidorId <= 0 || !latValida(lat) || !lngValida(lng)) {
    console.error('Uso: node src/courier-client.js <repartidorId> <lat> <lng> [--auto] [--mover]');
    process.exit(1);
}

const host = process.env.TCP_HOST || 'localhost';
const port = Number(process.env.TCP_PORT || 12345);
const INTERVALO_MS = 10000;
const PASO_GRADOS = 0.0008; // ~90 m

const socket = net.connect(port, host);
const enviar = (obj) => socket.write(JSON.stringify(obj) + '\n');
let ofertaActual = null;
let disponible = true;

const enviarUbicacion = () => enviar({ tipo: 'ACTUALIZAR_UBICACION', repartidorId, lat, lng, disponible });
const resumen = () => `(${lat.toFixed(5)}, ${lng.toFixed(5)}) ${disponible ? 'libre' : 'ocupado'}`;

function moverAlAzar() {
    const paso = () => (Math.random() * 2 - 1) * PASO_GRADOS;
    lat = Math.max(-90, Math.min(90, lat + paso()));
    lng = Math.max(-180, Math.min(180, lng + paso()));
}

socket.on('connect', () => {
    console.log(`🛵 Repartidor ${repartidorId} conectado a ${host}:${port} en ${resumen()}`);
    enviar({ tipo: 'REGISTRAR_REPARTIDOR', repartidorId, lat, lng });
    setInterval(() => {
        if (moverSolo) {
            moverAlAzar();
            console.log(`🚶 Nueva posición ${resumen()}`);
        }
        enviarUbicacion();
    }, INTERVALO_MS).unref();
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
    } else if (m.tipo === 'ASIGNACION_OK') {
        // El servidor lo marca ocupado; se refleja aquí para que las próximas
        // actualizaciones de ubicación no lo vuelvan a poner libre.
        disponible = false;
        ofertaActual = null;
        console.log(`✅ Pedido ${m.pedidoId} asignado. Quedas ocupado; escribe "libre" al terminar.`);
    } else {
        console.log('←', JSON.stringify(m));
    }
}

readline.createInterface({ input: process.stdin }).on('line', (linea) => {
    const [comando, a, b] = linea.trim().toLowerCase().split(/\s+/);

    if (comando === 'a' || comando === 'r') {
        if (ofertaActual === null) return console.log('No hay oferta vigente');
        enviar({ tipo: comando === 'a' ? 'ACEPTAR_PEDIDO' : 'RECHAZAR_PEDIDO', pedidoId: ofertaActual, repartidorId });
        ofertaActual = null;
    } else if (comando === 'libre' || comando === 'ocupado') {
        disponible = comando === 'libre';
        enviarUbicacion();
        console.log(`Ahora estás ${comando}`);
    } else if (comando === 'pos') {
        const nuevaLat = Number(a);
        const nuevaLng = Number(b);
        if (!latValida(nuevaLat) || !lngValida(nuevaLng)) return console.log('Uso: pos <lat> <lng>');
        lat = nuevaLat;
        lng = nuevaLng;
        enviarUbicacion();
        console.log(`🚶 Nueva posición ${resumen()}`);
    } else if (comando === 'estado') {
        console.log(`Repartidor ${repartidorId} en ${resumen()}`);
    } else if (comando) {
        console.log('Comandos: a, r, libre, ocupado, pos <lat> <lng>, estado');
    }
});

socket.on('error', (e) => { console.error('Error:', e.message); process.exit(1); });
socket.on('close', () => { console.log('Conexión cerrada'); process.exit(0); });
