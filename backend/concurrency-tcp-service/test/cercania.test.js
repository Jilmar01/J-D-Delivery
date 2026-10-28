const test = require('node:test');
console.log = () => {}; // el servidor registra eventos; se silencia para no mezclarlo con la salida del runner
const assert = require('node:assert');
const net = require('net');

const { crearServidor } = require('../server');
const { distanciaKm, masCercanos } = require('../src/geo');
const { enviarMensaje } = require('../src/tcp-client');

// Almacén en memoria: comprobar y asignar ocurre sin await en medio, como lo haría el
// UPDATE atómico de PostgreSQL. Así estas pruebas no dependen del esquema de la base.
function storeFalso() {
    const pedidos = new Map();
    return {
        pedidos,
        init: async () => {},
        close: async () => {},
        consultar: async () => null,
        asignar: async (pedidoId, repartidorId) => {
            if (pedidos.has(pedidoId)) return { asignado: false, motivo: 'YA_ASIGNADO' };
            pedidos.set(pedidoId, repartidorId);
            return { asignado: true, pedido: { id: pedidoId, repartidorId, estado: 'ASSIGNED' } };
        },
    };
}

const PEDIDO = { lat: -0.1807, lng: -78.4678 }; // Quito
// Latitud desplazada ~0.0045° ≈ 0.5 km cada paso
const cerca = (km) => ({ lat: PEDIDO.lat + km / 111, lng: PEDIDO.lng });

async function levantar(opciones) {
    const store = storeFalso();
    const server = crearServidor({ store, opciones });
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    return { store, server, port: server.address().port, conexiones: [] };
}

// Repartidor con conexión abierta: guarda lo que recibe y permite esperar un tipo de mensaje
async function repartidor(ctx, id, pos) {
    const socket = net.connect(ctx.port, '127.0.0.1');
    ctx.conexiones.push(socket);
    const mensajes = [];
    const esperando = [];
    let buffer = '';
    socket.on('data', (d) => {
        buffer += d.toString();
        const lineas = buffer.split('\n');
        buffer = lineas.pop();
        for (const l of lineas.filter(Boolean)) {
            const m = JSON.parse(l);
            mensajes.push(m);
            for (const e of esperando.filter((x) => x.tipos.includes(m.tipo))) {
                esperando.splice(esperando.indexOf(e), 1);
                e.resolve(m);
            }
        }
    });
    const enviar = (obj) => socket.write(JSON.stringify(obj) + '\n');
    // Espera el primer mensaje de alguno de los tipos indicados (texto o lista)
    const esperar = (tipos, ms = 2000) => {
        const lista = [].concat(tipos);
        const previo = mensajes.find((m) => lista.includes(m.tipo));
        if (previo) return Promise.resolve(previo);
        return new Promise((resolve, reject) => {
            const espera = {
                tipos: lista,
                resolve: (m) => { clearTimeout(timer); resolve(m); },
            };
            const timer = setTimeout(() => {
                esperando.splice(esperando.indexOf(espera), 1);
                reject(new Error(`Repartidor ${id}: no llegó ${lista.join(' / ')}`));
            }, ms);
            esperando.push(espera);
        });
    };
    await new Promise((r) => socket.on('connect', r));
    enviar({ tipo: 'REGISTRAR_REPARTIDOR', repartidorId: id, lat: pos.lat, lng: pos.lng });
    await esperar('REGISTRADO');
    return { id, mensajes, enviar, esperar };
}

async function cerrar(ctx) {
    ctx.conexiones.forEach((s) => s.destroy());
    await new Promise((r) => ctx.server.close(r));
}

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

test('geo: Haversine Quito-Guayaquil ≈ 270 km y selección de los más cercanos', () => {
    const d = distanciaKm(-0.1807, -78.4678, -2.1894, -79.8891);
    assert.ok(d > 260 && d < 280, `distancia inesperada: ${d}`);

    const lista = [
        { id: 1, ...cerca(3) }, { id: 2, ...cerca(0.5) }, { id: 3, ...cerca(1) }, { id: 4, ...cerca(50) },
    ];
    const r = masCercanos(lista, PEDIDO.lat, PEDIDO.lng, 2, 10);
    assert.deepStrictEqual(r.map((x) => x.id), [2, 3]);
    assert.ok(r[0].distanciaKm < r[1].distanciaKm);
});

test('el pedido se ofrece solo a los N más cercanos dentro del radio', async () => {
    const ctx = await levantar({ nOfertas: 2, maxKm: 10 });
    try {
        const a = await repartidor(ctx, 1, cerca(0.5));
        const b = await repartidor(ctx, 2, cerca(1));
        const c = await repartidor(ctx, 3, cerca(3));
        const lejos = await repartidor(ctx, 4, cerca(50));

        const r = await enviarMensaje({ tipo: 'NUEVO_PEDIDO', pedidoId: 10, ...PEDIDO, direccion: 'Quito' }, { host: '127.0.0.1', port: ctx.port });
        assert.strictEqual(r.tipo, 'OFERTA_ENVIADA');
        assert.deepStrictEqual(r.repartidores.map((x) => x.repartidorId), [1, 2]);

        const oferta = await a.esperar('OFERTA_PEDIDO');
        assert.strictEqual(oferta.pedidoId, 10);
        await b.esperar('OFERTA_PEDIDO');
        await pausa(100);
        assert.ok(!c.mensajes.some((m) => m.tipo === 'OFERTA_PEDIDO'), 'el 3.º más cercano no debe recibir oferta');
        assert.ok(!lejos.mensajes.some((m) => m.tipo === 'OFERTA_PEDIDO'), 'fuera del radio no recibe oferta');
    } finally {
        await cerrar(ctx);
    }
});

test('dos repartidores aceptan a la vez: uno gana, el otro es rechazado', async () => {
    const ctx = await levantar({ nOfertas: 3, maxKm: 10 });
    try {
        const a = await repartidor(ctx, 1, cerca(0.5));
        const b = await repartidor(ctx, 2, cerca(1));
        await enviarMensaje({ tipo: 'NUEVO_PEDIDO', pedidoId: 20, ...PEDIDO }, { host: '127.0.0.1', port: ctx.port });
        await a.esperar('OFERTA_PEDIDO');
        await b.esperar('OFERTA_PEDIDO');

        a.enviar({ tipo: 'ACEPTAR_PEDIDO', pedidoId: 20, repartidorId: 1 });
        b.enviar({ tipo: 'ACEPTAR_PEDIDO', pedidoId: 20, repartidorId: 2 });
        const resultado = ['ASIGNACION_OK', 'ASIGNACION_RECHAZADA'];
        const [ra, rb] = await Promise.all([a.esperar(resultado), b.esperar(resultado)]);
        const resultados = [ra, rb];
        assert.strictEqual(resultados.filter((r) => r.tipo === 'ASIGNACION_OK').length, 1);
        assert.strictEqual(resultados.filter((r) => r.tipo === 'ASIGNACION_RECHAZADA').length, 1);
        assert.strictEqual(ctx.store.pedidos.size, 1);
        const ganador = resultados.find((r) => r.tipo === 'ASIGNACION_OK').repartidorId;
        assert.strictEqual(ctx.store.pedidos.get(20), ganador);
    } finally {
        await cerrar(ctx);
    }
});

test('si el primero rechaza, la oferta pasa al siguiente más cercano', async () => {
    const ctx = await levantar({ nOfertas: 1, maxKm: 10 });
    try {
        const a = await repartidor(ctx, 1, cerca(0.5));
        const b = await repartidor(ctx, 2, cerca(1));
        await enviarMensaje({ tipo: 'NUEVO_PEDIDO', pedidoId: 30, ...PEDIDO }, { host: '127.0.0.1', port: ctx.port });
        await a.esperar('OFERTA_PEDIDO');
        assert.ok(!b.mensajes.some((m) => m.tipo === 'OFERTA_PEDIDO'));

        a.enviar({ tipo: 'RECHAZAR_PEDIDO', pedidoId: 30, repartidorId: 1 });
        const oferta = await b.esperar('OFERTA_PEDIDO');
        assert.strictEqual(oferta.pedidoId, 30);
    } finally {
        await cerrar(ctx);
    }
});

test('si el primero no responde, la oferta expira y pasa al siguiente', async () => {
    const ctx = await levantar({ nOfertas: 1, maxKm: 10, timeoutMs: 150 });
    try {
        const a = await repartidor(ctx, 1, cerca(0.5));
        const b = await repartidor(ctx, 2, cerca(1));
        await enviarMensaje({ tipo: 'NUEVO_PEDIDO', pedidoId: 40, ...PEDIDO }, { host: '127.0.0.1', port: ctx.port });
        await a.esperar('OFERTA_EXPIRADA');
        await b.esperar('OFERTA_PEDIDO');
    } finally {
        await cerrar(ctx);
    }
});

test('aceptar sin oferta vigente, ubicación sin registro y pedido sin repartidores', async () => {
    const ctx = await levantar({ maxKm: 1 });
    const opts = { host: '127.0.0.1', port: ctx.port };
    try {
        const sinOferta = await enviarMensaje({ tipo: 'ACEPTAR_PEDIDO', pedidoId: 50, repartidorId: 9 }, opts);
        assert.deepStrictEqual(sinOferta, { tipo: 'ASIGNACION_RECHAZADA', pedidoId: 50, motivo: 'SIN_OFERTA' });

        const noRegistrado = await enviarMensaje({ tipo: 'ACTUALIZAR_UBICACION', repartidorId: 9, lat: 0, lng: 0 }, opts);
        assert.strictEqual(noRegistrado.motivo, 'NO_REGISTRADO');

        const invalido = await enviarMensaje({ tipo: 'NUEVO_PEDIDO', pedidoId: 50, lat: 200, lng: 0 }, opts);
        assert.strictEqual(invalido.motivo, 'CAMPOS_INVALIDOS');

        await repartidor(ctx, 1, cerca(50)); // fuera del radio de 1 km
        const nadie = await enviarMensaje({ tipo: 'NUEVO_PEDIDO', pedidoId: 50, ...PEDIDO }, opts);
        assert.deepStrictEqual(nadie, { tipo: 'SIN_REPARTIDORES', pedidoId: 50, motivo: 'SIN_REPARTIDORES' });
    } finally {
        await cerrar(ctx);
    }
});
