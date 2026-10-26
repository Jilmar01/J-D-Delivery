// =============================================================================
// CONCURRENCIA: SOLICITUDES SIMULTÁNEAS CONTRA UN SERVIDOR EN EJECUCIÓN  (BE2-04)
// Lanza N repartidores a la vez sobre el MISMO pedido y comprueba que solo uno gana.
// Sirve para repetir la prueba desde varias computadoras (TCP_HOST = IP del servidor).
//
//   node src/concurrencia.js <pedidoId> [cantidad=10]
//
// Con DATABASE_URL definida, el script deja el pedido en PENDIENTE antes de empezar
// (si no existe lo crea), para poder repetirlo. Sin DATABASE_URL, el pedido
// debe existir ya en la base y estar PENDIENTE.
// =============================================================================
const { enviarMensaje } = require('./tcp-client');
const { crearStore } = require('./asignacion');

async function main() {
    const pedidoId = Number(process.argv[2]);
    const cantidad = Number(process.argv[3] || 10);
    if (!Number.isSafeInteger(pedidoId) || pedidoId <= 0) {
        console.error('Uso: node src/concurrencia.js <pedidoId> [cantidad]');
        process.exit(1);
    }

    if (process.env.DATABASE_URL) {
        const store = crearStore(process.env.DATABASE_URL);
        await store.sembrar(pedidoId);
        await store.close();
        console.log(`Pedido ${pedidoId} restablecido a PENDIENTE`);
    }

    console.log(`Enviando ${cantidad} solicitudes simultáneas para el pedido ${pedidoId}...\n`);
    const respuestas = await Promise.all(
        Array.from({ length: cantidad }, (_, i) =>
            enviarMensaje({ tipo: 'ASIGNAR_PEDIDO', pedidoId, repartidorId: i + 1 })
                .then((r) => ({ repartidorId: i + 1, ...r }))
        )
    );

    respuestas.forEach((r) => console.log(`Repartidor ${r.repartidorId}: ${r.tipo}${r.motivo ? ' (' + r.motivo + ')' : ''}`));

    const ganadores = respuestas.filter((r) => r.tipo === 'ASIGNACION_OK');
    const estado = await enviarMensaje({ tipo: 'CONSULTAR_PEDIDO', pedidoId });
    console.log('\nEstado final:', JSON.stringify(estado.pedido));

    const correcto = ganadores.length === 1 && estado.pedido?.repartidorId === ganadores[0].repartidorId;
    console.log(correcto ? '\n✅ CORRECTO: exactamente una asignación' : `\n❌ ERROR: ${ganadores.length} asignaciones exitosas`);
    process.exit(correcto ? 0 : 1);
}

main().catch((e) => { console.error('Error:', e.message); process.exit(1); });
