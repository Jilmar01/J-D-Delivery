// =============================================================================
// ASIGNACIÓN CONCURRENTE DE PEDIDOS - J&D DELIVERY  (BE2-01, BE2-02, BE2-03)
// =============================================================================

// Espacio del bloqueo: evita chocar con otros usos de bloqueos de aplicación
const ESPACIO_BLOQUEO = 7101;

class PostgresStore {
    // `pool` se puede inyectar (pruebas); si no, se crea desde connectionString
    constructor({ connectionString, pool } = {}) {
        if (pool) {
            this.pool = pool;
            // pg-mem comparte una sola transacción entre todas las conexiones, así que en
            // las pruebas con pool inyectado se encolan las transacciones. Con PostgreSQL
            // real (sin pool inyectado) NO se encola: el bloqueo de la base es el que protege.
            this.encolar = true;
        } else {
            const { Pool } = require('pg');
            // Límites de tiempo: si la base no responde, la solicitud falla en vez de quedarse colgada
            this.pool = new Pool({ connectionString, connectionTimeoutMillis: 5000, statement_timeout: 5000 });
            // Sin este handler, un corte de PostgreSQL con conexiones inactivas tumbaría el proceso
            this.pool.on('error', (err) => console.error('⚠️ Error en el pool de PostgreSQL:', err.message));
        }
        this.cola = Promise.resolve();
    }

    async init() {
        await this.pool.query('SELECT 1');
    }

    // `direccion` es obligatoria en deliveries; si el mensaje no la trae se usa un texto fijo
    asignar(pedidoId, repartidorId, direccion) {
        if (!this.encolar) return this._asignar(pedidoId, repartidorId, direccion);
        const turno = this.cola.then(() => this._asignar(pedidoId, repartidorId, direccion));
        this.cola = turno.catch(() => {});
        return turno;
    }

    async _asignar(pedidoId, repartidorId, direccion) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('SELECT pg_advisory_xact_lock($1::int, $2::int)', [ESPACIO_BLOQUEO, pedidoId]);

            const existente = await client.query(
                `SELECT status FROM deliveries WHERE "orderId" = $1 AND status <> 'CANCELLED' LIMIT 1`,
                [pedidoId]
            );
            if (existente.rows.length > 0) {
                await client.query('ROLLBACK');
                return { asignado: false, motivo: 'YA_ASIGNADO' };
            }

            const r = await client.query(
                `INSERT INTO deliveries ("orderId", "courierId", "deliveryAddress", status, "assignedAt", "updatedAt")
                 VALUES ($1, $2, $3, 'ASSIGNED', now(), now())
                 RETURNING id, "orderId", "courierId", status`,
                [pedidoId, repartidorId, direccion || 'Sin dirección']
            );
            const f = r.rows[0];
            await client.query(
                `INSERT INTO delivery_history ("deliveryId", "previousStatus", "newStatus", notes)
                 VALUES ($1, NULL, 'ASSIGNED', $2)`,
                [f.id, `Asignado al repartidor ${repartidorId}`]
            );
            await client.query('COMMIT');
            return { asignado: true, pedido: { id: Number(f.orderId), repartidorId: Number(f.courierId), estado: f.status } };
        } catch (err) {
            await client.query('ROLLBACK').catch(() => {});
            // Red de seguridad: el índice único sobre "orderId" (23505) también impide la doble asignación
            if (err.code === '23505') return { asignado: false, motivo: 'YA_ASIGNADO' };
            throw err;
        } finally {
            client.release();
        }
    }

    // Sin entrega activa el pedido se considera PENDING (aquí no se consulta la tabla de pedidos)
    async consultar(pedidoId) {
        const r = await this.pool.query(
            `SELECT status, "courierId" FROM deliveries
              WHERE "orderId" = $1 AND status <> 'CANCELLED' ORDER BY id DESC LIMIT 1`,
            [pedidoId]
        );
        if (!r.rows[0]) return { id: pedidoId, estado: 'PENDING', repartidorId: null };
        const f = r.rows[0];
        return { id: pedidoId, estado: f.status, repartidorId: f.courierId === null ? null : Number(f.courierId) };
    }

    // Solo para pruebas: deja el pedido sin entrega (la asignación la crea)
    async sembrar(pedidoId) {
        await this.pool.query(
            `DELETE FROM delivery_history WHERE "deliveryId" IN (SELECT id FROM deliveries WHERE "orderId" = $1)`,
            [pedidoId]
        );
        await this.pool.query(`DELETE FROM deliveries WHERE "orderId" = $1`, [pedidoId]);
    }

    async close() {
        await this.pool.end();
    }
}

function crearStore(databaseUrl) {
    return new PostgresStore({ connectionString: databaseUrl });
}

module.exports = { crearStore, PostgresStore };
