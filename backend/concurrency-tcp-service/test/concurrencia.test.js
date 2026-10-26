// Pruebas de concurrencia y TCP: `npm test`
// Se ejecutan contra PostgreSQL simulado (pg-mem).
// Si DATABASE_URL está definida, se repiten también contra el PostgreSQL real.
const test = require('node:test');
const assert = require('node:assert');
const net = require('node:net');
const { newDb } = require('pg-mem');
const { crearServidor } = require('../server');
const { PostgresStore, crearStore } = require('../src/asignacion');
const { enviarMensaje } = require('../src/tcp-client');

// Base de Jilmar con los cambios de la sección 6 del README (estado ASIGNADO y "repartidorId").
// total es NUMERIC porque pg-mem no soporta DECIMAL(10,2), que es lo que usa la base real.
const baseJilmar = `
    CREATE TYPE "EstadoPedido" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO', 'ASIGNADO');
    CREATE TABLE "Pedido" (
        "id" SERIAL PRIMARY KEY, "clienteId" TEXT NOT NULL, "descripcion" TEXT,
        "total" NUMERIC NOT NULL, "estado" "EstadoPedido" NOT NULL DEFAULT 'PENDIENTE',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "repartidorId" BIGINT
    );`;

const almacenes = {
    'postgres (pg-mem)': async () => {
        const db = newDb();
        db.public.none(baseJilmar);
        const pool = new (db.adapters.createPg().Pool)();
        return new PostgresStore({ pool });
    },
};
if (process.env.DATABASE_URL) {
    almacenes['postgres (real)'] = async () => crearStore(process.env.DATABASE_URL);
}

async function levantar(crearAlmacen) {
    const store = await crearAlmacen();
    await store.init();
    const server = crearServidor({ store });
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    return { store, server, opts: { host: '127.0.0.1', port: server.address().port } };
}

async function cerrar({ store, server }) {
    server.close();
    await store.close();
}

for (const [nombre, crearAlmacen] of Object.entries(almacenes)) {
    test(`[${nombre}] 50 repartidores piden el mismo pedido a la vez: solo uno lo obtiene`, async () => {
        const ctx = await levantar(crearAlmacen);
        const pedidoId = 1001;
        try {
            await ctx.store.sembrar(pedidoId);
            const respuestas = await Promise.all(
                Array.from({ length: 50 }, (_, i) =>
                    enviarMensaje({ tipo: 'ASIGNAR_PEDIDO', pedidoId, repartidorId: i + 1 }, ctx.opts))
            );
            const ganadores = respuestas.filter((r) => r.tipo === 'ASIGNACION_OK');
            const rechazadas = respuestas.filter((r) => r.tipo === 'ASIGNACION_RECHAZADA');
            assert.strictEqual(ganadores.length, 1);
            assert.strictEqual(rechazadas.length, 49);
            assert.ok(rechazadas.every((r) => r.motivo === 'YA_ASIGNADO'));

            // Una sola asignación persistida y coherente con el ganador
            const { pedido } = await enviarMensaje({ tipo: 'CONSULTAR_PEDIDO', pedidoId }, ctx.opts);
            assert.strictEqual(pedido.estado, 'ASIGNADO');
            assert.strictEqual(pedido.repartidorId, ganadores[0].repartidorId);
        } finally {
            await cerrar(ctx);
        }
    });

    test(`[${nombre}] pedidos distintos se asignan en paralelo, y los inexistentes se rechazan`, async () => {
        const ctx = await levantar(crearAlmacen);
        try {
            for (let i = 0; i < 20; i++) await ctx.store.sembrar(2000 + i);
            const respuestas = await Promise.all(
                Array.from({ length: 20 }, (_, i) =>
                    enviarMensaje({ tipo: 'ASIGNAR_PEDIDO', pedidoId: 2000 + i, repartidorId: 7 }, ctx.opts))
            );
            assert.ok(respuestas.every((r) => r.tipo === 'ASIGNACION_OK'));

            const noExiste = await enviarMensaje({ tipo: 'ASIGNAR_PEDIDO', pedidoId: 999999, repartidorId: 7 }, ctx.opts);
            assert.deepStrictEqual(noExiste, { tipo: 'ASIGNACION_RECHAZADA', pedidoId: 999999, motivo: 'NO_ENCONTRADO' });
        } finally {
            await cerrar(ctx);
        }
    });
}

test('TCP: mensajes inválidos devuelven ERROR y el evento PEDIDO_ASIGNADO recibe ACK', async () => {
    const ctx = await levantar(almacenes['postgres (pg-mem)']);
    try {
        const sinCampos = await enviarMensaje({ tipo: 'ASIGNAR_PEDIDO', pedidoId: 'abc', repartidorId: 1 }, ctx.opts);
        assert.strictEqual(sinCampos.tipo, 'ERROR');
        assert.strictEqual(sinCampos.motivo, 'CAMPOS_INVALIDOS');

        const ack = await enviarMensaje({ tipo: 'PEDIDO_ASIGNADO', pedidoId: 1, repartidorId: 7 }, ctx.opts);
        assert.deepStrictEqual(ack, { tipo: 'ACK', evento: 'PEDIDO_ASIGNADO' });
    } finally {
        await cerrar(ctx);
    }
});

test('TCP: el servidor delimita por \\n (mensaje partido en trozos y varios mensajes en un envío)', async () => {
    const ctx = await levantar(almacenes['postgres (pg-mem)']);
    try {
        await ctx.store.sembrar(1);
        await ctx.store.sembrar(2);
        const recibido = await new Promise((resolve, reject) => {
            const socket = net.connect(ctx.opts.port, ctx.opts.host);
            let buf = '';
            socket.on('data', (d) => {
                buf += d.toString();
                const lineas = buf.split('\n').filter(Boolean);
                if (lineas.length === 3) { socket.end(); resolve(lineas.map((l) => JSON.parse(l))); }
            });
            socket.on('error', reject);
            socket.on('connect', async () => {
                // Un mensaje partido en dos escrituras
                socket.write('{"tipo":"ASIGNAR_PEDIDO","pedi');
                await new Promise((r) => setTimeout(r, 50));
                // Fin del primero + dos mensajes completos en una sola escritura
                socket.write('doId":1,"repartidorId":5}\n' +
                    '{"tipo":"CONSULTAR_PEDIDO","pedidoId":1}\n' +
                    '{"tipo":"ASIGNAR_PEDIDO","pedidoId":2,"repartidorId":6}\n');
            });
        });
        assert.strictEqual(recibido[0].tipo, 'ASIGNACION_OK');
        assert.strictEqual(recibido[1].pedido.repartidorId, 5);
        assert.strictEqual(recibido[2].repartidorId, 6);
    } finally {
        await cerrar(ctx);
    }
});

test('asignación segura: pedidoId fuera de rango se rechaza antes de llegar a la base', async () => {
    const ctx = await levantar(almacenes['postgres (pg-mem)']);
    try {
        const r = await enviarMensaje({ tipo: 'ASIGNAR_PEDIDO', pedidoId: 2147483648, repartidorId: 1 }, ctx.opts);
        assert.strictEqual(r.tipo, 'ERROR');
        assert.strictEqual(r.motivo, 'CAMPOS_INVALIDOS');
    } finally {
        await cerrar(ctx);
    }
});

test('asignación segura: si la base falla, el servidor responde ERROR genérico y sigue vivo', async () => {
    const store = {
        init: async () => {},
        close: async () => {},
        asignar: async () => { throw new Error('connection refused a 10.0.0.5:5432 password=secreta'); },
        consultar: async () => null,
    };
    const server = crearServidor({ store });
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    const opts = { host: '127.0.0.1', port: server.address().port };
    try {
        const r = await enviarMensaje({ tipo: 'ASIGNAR_PEDIDO', pedidoId: 1, repartidorId: 1 }, opts);
        assert.strictEqual(r.motivo, 'INTERNO');
        assert.ok(!JSON.stringify(r).includes('secreta'), 'no debe filtrar detalles de la base');
        // El servidor sigue atendiendo después del fallo
        assert.strictEqual((await enviarMensaje({ tipo: 'PEDIDO_ASIGNADO', pedidoId: 1 }, opts)).tipo, 'ACK');
    } finally {
        server.close();
    }
});
