// =============================================================================
// OFERTAS DE PEDIDOS POR CERCANÍA - J&D DELIVERY
//
// La cercanía se mide contra el punto de SALIDA del pedido (lat/lng: el local donde
// el repartidor debe recogerlo); el punto de entrega (entregaLat/entregaLng) solo se
// reenvía en la oferta.
//
// Un pedido nuevo se ofrece a los N repartidores disponibles más cercanos
// (broadcast). El primero que acepta intenta la asignación atómica en la base de
// datos; la base decide al ganador. Si nadie acepta antes de `timeoutMs` o todos
// rechazan, se ofrece a la siguiente ronda de más cercanos que aún no la vieron.
// =============================================================================
const { masCercanos } = require('./geo');
const { serializar } = require('./protocolo');

const OPCIONES_DEFECTO = { nOfertas: 3, maxKm: 10, timeoutMs: 15000, edadMaxMs: 60000 };

function crearOfertas({ store, registro, ...opciones }) {
    const { nOfertas, maxKm, timeoutMs, edadMaxMs } = { ...OPCIONES_DEFECTO, ...opciones };
    const activas = new Map(); // pedidoId -> { pedido, ofrecidos, vigentes, timer }

    function enviar(repartidorId, mensaje) {
        const r = registro.obtener(repartidorId);
        if (r && r.socket && !r.socket.destroyed) r.socket.write(serializar(mensaje));
    }

    function cerrar(estado) {
        clearTimeout(estado.timer);
        if (activas.get(estado.pedido.id) === estado) activas.delete(estado.pedido.id);
    }

    // Ofrece el pedido a la siguiente tanda. Devuelve los destinatarios ([] si no hay nadie)
    function ronda(estado) {
        const { id, lat, lng, direccion, entregaLat, entregaLng } = estado.pedido;
        const candidatos = masCercanos(
            registro.disponibles(edadMaxMs).filter((r) => !estado.ofrecidos.has(r.id)),
            lat, lng, nOfertas, maxKm
        );
        if (candidatos.length === 0) {
            cerrar(estado);
            return [];
        }
        const expiraEn = new Date(Date.now() + timeoutMs).toISOString();
        for (const c of candidatos) {
            estado.ofrecidos.add(c.id);
            estado.vigentes.add(c.id);
            enviar(c.id, {
                tipo: 'OFERTA_PEDIDO', pedidoId: id, direccion, lat, lng, entregaLat, entregaLng,
                distanciaKm: Number(c.distanciaKm.toFixed(2)), expiraEn,
            });
        }
        estado.timer = setTimeout(() => {
            for (const rid of estado.vigentes) enviar(rid, { tipo: 'OFERTA_EXPIRADA', pedidoId: id });
            estado.vigentes.clear();
            ronda(estado);
        }, timeoutMs);
        estado.timer.unref();
        return candidatos.map((c) => ({ repartidorId: c.id, distanciaKm: Number(c.distanciaKm.toFixed(2)) }));
    }

    function ofrecer(pedido) {
        if (activas.has(pedido.id)) return { ok: false, motivo: 'OFERTA_EN_CURSO' };
        const estado = { pedido, ofrecidos: new Set(), vigentes: new Set(), timer: null };
        activas.set(pedido.id, estado);
        const repartidores = ronda(estado);
        return repartidores.length > 0 ? { ok: true, repartidores } : { ok: false, motivo: 'SIN_REPARTIDORES' };
    }

    async function aceptar(pedidoId, repartidorId) {
        const estado = activas.get(pedidoId);
        if (!estado || !estado.vigentes.has(repartidorId)) return { asignado: false, motivo: 'SIN_OFERTA' };

        // La protección ante aceptaciones simultáneas está en la base (UPDATE atómico)
        const r = await store.asignar(pedidoId, repartidorId, estado.pedido.direccion);
        if (r.asignado) registro.marcarOcupado(repartidorId);

        // Gane o no, la oferta termina: se avisa a los demás que ya no está disponible
        for (const rid of estado.vigentes) {
            if (rid !== repartidorId) enviar(rid, { tipo: 'PEDIDO_TOMADO', pedidoId });
        }
        estado.vigentes.clear();
        cerrar(estado);
        return r;
    }

    // Un repartidor descarta la oferta (o se desconecta). Si era el último, pasa a la siguiente tanda
    function rechazar(pedidoId, repartidorId) {
        const estado = activas.get(pedidoId);
        if (!estado || !estado.vigentes.delete(repartidorId)) return;
        if (estado.vigentes.size === 0) {
            clearTimeout(estado.timer);
            ronda(estado);
        }
    }

    function quitarRepartidor(repartidorId) {
        for (const pedidoId of [...activas.keys()]) rechazar(pedidoId, repartidorId);
    }

    function detener() {
        for (const estado of activas.values()) clearTimeout(estado.timer);
        activas.clear();
    }

    return { ofrecer, aceptar, rechazar, quitarRepartidor, detener };
}

module.exports = { crearOfertas };
