// =============================================================================
// REGISTRO DE REPARTIDORES CONECTADOS - J&D DELIVERY
// Vive en memoria: cada repartidor mantiene una conexión TCP abierta con el
// servidor, informa su ubicación y recibe ofertas por ese mismo socket.
// Si el servidor se reinicia, los repartidores deben volver a registrarse.
// =============================================================================

class RegistroRepartidores {
    constructor() {
        this.porId = new Map();
    }

    registrar(id, lat, lng, socket) {
        this.porId.set(id, { id, lat, lng, socket, disponible: true, ts: Date.now() });
    }

    obtener(id) {
        return this.porId.get(id);
    }

    // `disponible` es opcional: si no se indica, se conserva el valor anterior
    actualizar(id, lat, lng, disponible) {
        const r = this.porId.get(id);
        if (!r) return false;
        r.lat = lat;
        r.lng = lng;
        r.ts = Date.now();
        if (typeof disponible === 'boolean') r.disponible = disponible;
        return true;
    }

    marcarOcupado(id) {
        const r = this.porId.get(id);
        if (r) r.disponible = false;
    }

    // Libera al repartidor de la conexión cerrada (solo si sigue siendo su socket actual)
    quitarPorSocket(socket) {
        for (const [id, r] of this.porId) {
            if (r.socket === socket) {
                this.porId.delete(id);
                return id;
            }
        }
        return null;
    }

    // Disponibles, con conexión viva y ubicación reciente
    disponibles(edadMaxMs) {
        const limite = Date.now() - edadMaxMs;
        return [...this.porId.values()].filter(
            (r) => r.disponible && r.ts >= limite && r.socket && !r.socket.destroyed
        );
    }
}

module.exports = { RegistroRepartidores };
