// =============================================================================
// GEOLOCALIZACIÓN - J&D DELIVERY
// Distancia entre coordenadas (fórmula de Haversine) y selección de los
// repartidores disponibles más cercanos a un punto.
// =============================================================================

const RADIO_TIERRA_KM = 6371;
const aRadianes = (grados) => (grados * Math.PI) / 180;

function distanciaKm(lat1, lng1, lat2, lng2) {
    const a = Math.sin(aRadianes(lat2 - lat1) / 2) ** 2 +
        Math.cos(aRadianes(lat1)) * Math.cos(aRadianes(lat2)) * Math.sin(aRadianes(lng2 - lng1) / 2) ** 2;
    return 2 * RADIO_TIERRA_KM * Math.asin(Math.sqrt(a));
}

// repartidores: [{ id, lat, lng, ... }]. Devuelve hasta `n` dentro de `maxKm`,
// del más cercano al más lejano, cada uno con su `distanciaKm`.
function masCercanos(repartidores, lat, lng, n, maxKm) {
    return repartidores
        .map((r) => ({ ...r, distanciaKm: distanciaKm(r.lat, r.lng, lat, lng) }))
        .filter((r) => r.distanciaKm <= maxKm)
        .sort((a, b) => a.distanciaKm - b.distanciaKm)
        .slice(0, n);
}

module.exports = { distanciaKm, masCercanos };
