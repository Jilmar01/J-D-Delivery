// =============================================================================
// ASIGNACIÓN CONCURRENTE DE PEDIDOS - J&D DELIVERY  (BE2-01, BE2-02, BE2-03)
//
// Mecanismo: UNA sola sentencia UPDATE atómica en PostgreSQL.
//
//   UPDATE "Pedido" SET "repartidorId" = $1, estado = 'ASIGNADO'
//   WHERE id = $2 AND estado = 'PENDIENTE' AND "repartidorId" IS NULL
//   RETURNING id, "repartidorId", estado;
//
// PostgreSQL bloquea la fila mientras la actualiza: si dos solicitudes llegan a
// la vez, la segunda espera, vuelve a evaluar el WHERE y ya no encuentra la fila
// (estado distinto de PENDIENTE) -> 0 filas -> rechazada. Esto protege aunque las
// solicitudes vengan de procesos o computadoras distintas.
//   1 fila devuelta  -> asignación exitosa
//   0 filas devueltas -> el pedido no existe o ya no está disponible
//
// Usa la tabla "Pedido" de la base del equipo. La base debe tener el estado
// ASIGNADO y la columna "repartidorId" (ver README, sección 6).
// Si los nombres cambian: PEDIDOS_TABLE, PEDIDOS_COL_REPARTIDOR, PEDIDOS_COL_ACTUALIZADO.
// =============================================================================

const IDENTIFICADOR_VALIDO = /^[a-z_][a-z0-9_]*$/i;

// Entre comillas dobles para respetar mayúsculas ("Pedido", "repartidorId")
function ident(nombre) {
    if (!IDENTIFICADOR_VALIDO.test(nombre)) throw new Error(`Identificador SQL inválido: ${nombre}`);
    return `"${nombre}"`;
}

// Por defecto, los nombres de la base de datos del equipo (order-service / Prisma)
const NOMBRES_DEFECTO = { tabla: 'Pedido', repartidor: 'repartidorId', actualizado: 'updatedAt' };

function nombresDesdeEntorno(env = process.env) {
    return {
        tabla: env.PEDIDOS_TABLE || NOMBRES_DEFECTO.tabla,
        repartidor: env.PEDIDOS_COL_REPARTIDOR || NOMBRES_DEFECTO.repartidor,
        actualizado: env.PEDIDOS_COL_ACTUALIZADO || NOMBRES_DEFECTO.actualizado,
    };
}

class PostgresStore {
    // `pool` se puede inyectar (pruebas); si no, se crea desde connectionString
    constructor({ connectionString, nombres = NOMBRES_DEFECTO, pool } = {}) {
        this.tabla = ident(nombres.tabla);
        this.colRepartidor = ident(nombres.repartidor);
        this.colActualizado = ident(nombres.actualizado);
        if (pool) {
            this.pool = pool;
        } else {
            const { Pool } = require('pg');
            // Límites de tiempo: si la base no responde, la solicitud falla en vez de quedarse colgada
            this.pool = new Pool({ connectionString, connectionTimeoutMillis: 5000, statement_timeout: 5000 });
            // Sin este handler, un corte de PostgreSQL con conexiones inactivas tumbaría el proceso
            this.pool.on('error', (err) => console.error('⚠️ Error en el pool de PostgreSQL:', err.message));
        }
    }

    async init() {
        await this.pool.query('SELECT 1');
    }

    async asignar(pedidoId, repartidorId) {
        const r = await this.pool.query(
            `UPDATE ${this.tabla}
                SET ${this.colRepartidor} = $1, estado = 'ASIGNADO', ${this.colActualizado} = now()
              WHERE id = $2 AND estado = 'PENDIENTE' AND ${this.colRepartidor} IS NULL
          RETURNING id, ${this.colRepartidor} AS repartidor_id, estado`,
            [repartidorId, pedidoId]
        );
        if (r.rows.length === 1) {
            const f = r.rows[0];
            return { asignado: true, pedido: { id: Number(f.id), repartidorId: Number(f.repartidor_id), estado: f.estado } };
        }
        // No se pudo asignar: se averigua el motivo solo para informar al cliente
        const actual = await this.consultar(pedidoId);
        return { asignado: false, motivo: motivoRechazo(actual) };
    }

    async consultar(pedidoId) {
        const r = await this.pool.query(
            `SELECT id, estado, ${this.colRepartidor} AS repartidor_id FROM ${this.tabla} WHERE id = $1`,
            [pedidoId]
        );
        if (!r.rows[0]) return null;
        const f = r.rows[0];
        return { id: Number(f.id), estado: f.estado, repartidorId: f.repartidor_id === null ? null : Number(f.repartidor_id) };
    }

    // Solo para pruebas: deja el pedido en PENDIENTE sin repartidor (lo crea si no existe)
    async sembrar(pedidoId) {
        const r = await this.pool.query(
            `UPDATE ${this.tabla} SET estado = 'PENDIENTE', ${this.colRepartidor} = NULL WHERE id = $1`,
            [pedidoId]
        );
        if (r.rowCount === 0) {
            await this.pool.query(
                `INSERT INTO ${this.tabla} (id, "clienteId", descripcion, total, estado)
                 VALUES ($1, 'cliente-prueba', 'Pedido de prueba', 10, 'PENDIENTE')`,
                [pedidoId]
            );
        }
    }

    async close() {
        await this.pool.end();
    }
}

function motivoRechazo(pedido) {
    if (!pedido) return 'NO_ENCONTRADO';
    if (pedido.repartidorId !== null || pedido.estado === 'ASIGNADO') return 'YA_ASIGNADO';
    return 'ESTADO_INVALIDO';
}

function crearStore(databaseUrl, nombres = nombresDesdeEntorno()) {
    return new PostgresStore({ connectionString: databaseUrl, nombres });
}

module.exports = { crearStore, PostgresStore };
