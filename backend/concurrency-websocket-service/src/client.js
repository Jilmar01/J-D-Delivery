// =============================================================================
// CLIENTE JAVASCRIPT PARA TOMAR Y RESERVAR COMIDAS CON WEBSOCKETS (SOCKET.IO)
// Lógica pura de conexión para el Frontend (sin HTML ni CSS)
// =============================================================================

// Conectar con el servidor WebSocket (por defecto http://localhost:3000)
// Si se usa en navegador con Socket.io cargado: const socket = io('http://localhost:3000');
const SERVER_URL = 'http://localhost:3000';
let socket = null;

// Si se ejecuta en entorno navegador
if (typeof io !== 'undefined') {
    socket = io(SERVER_URL);
}

// Variables de estado del cliente
const selectedProducts = new Set();
let timerInterval = null;
let reservationEndTime = 0;
let catalogoProductos = {};
let usuarioActual = '';

/**
 * Inicializar la conexión y registrar listeners de eventos WebSocket
 * @param {string} username - Nombre del cliente logueado
 * @param {Object} callbacks - Callbacks para actualizar la vista en el frontend
 */
function iniciarWebSocketComidas(username, callbacks = {}) {
    if (!socket && typeof io !== 'undefined') {
        socket = io(SERVER_URL);
    }
    if (!socket) {
        console.warn('Socket.io client no está disponible aún. Asegúrate de incluir socket.io-client.');
        return;
    }

    usuarioActual = username;
    // Registrar el nombre del cliente en el servidor
    socket.emit('setUsername', username);

    // Recibir estado inicial de productos (lotes de 5) desde el servidor
    socket.on('init', (serverProductos) => {
        catalogoProductos = serverProductos;
        console.log('📦 Catálogo recibido con lotes de 5 unidades:', serverProductos);
        if (callbacks.onInit) callbacks.onInit(serverProductos);
    });

    // Cuando un producto es tomado / reservado por un usuario
    socket.on('reserve', ({ unidadId, comidaId, user, expiresAt }) => {
        console.log(`🟡 [RESERVA]: ${user} tomó ${unidadId}`);

        if (catalogoProductos[comidaId]?.unidades[unidadId]) {
            catalogoProductos[comidaId].unidades[unidadId].status = 'reserved';
            catalogoProductos[comidaId].unidades[unidadId].user = user;
        }

        // Manejar la lógica de usar expiresAt (2 minutos = 120s)
        if (user === usuarioActual) {
            reservationEndTime = expiresAt;
            starTimer(callbacks.onTimerTick, callbacks.onTimerExpire);
        }

        if (callbacks.onReserve) callbacks.onReserve({ unidadId, comidaId, user, expiresAt });
    });

    // Cuando el producto es liberado (por deselección o porque pasaron los 2 minutos)
    socket.on('release', (unidadId) => {
        console.log(`🟢 [LIBERADO]: ${unidadId} vuelve a estar disponible`);
        selectedProducts.delete(unidadId);

        const [comidaId] = unidadId.split('-');
        if (catalogoProductos[comidaId]?.unidades[unidadId]) {
            catalogoProductos[comidaId].unidades[unidadId].status = 'available';
            catalogoProductos[comidaId].unidades[unidadId].user = '';
        }

        if (selectedProducts.size === 0) {
            stopTimer(callbacks.onTimerStop);
        }

        if (callbacks.onRelease) callbacks.onRelease(unidadId);
    });

    // Cuando uno o más productos son comprados
    socket.on('buy', ({ unidadId, user }) => {
        console.log(`🎉 [COMPRADO]: ${unidadId} comprado por ${user}`);
        selectedProducts.delete(unidadId);

        const [comidaId] = unidadId.split('-');
        if (catalogoProductos[comidaId]?.unidades[unidadId]) {
            catalogoProductos[comidaId].unidades[unidadId].status = 'sold';
        }

        if (selectedProducts.size === 0) {
            stopTimer(callbacks.onTimerStop);
        }

        if (callbacks.onBuy) callbacks.onBuy({ unidadId, user });
    });

    // Alerta de reposición: el lote de 5 se agotó y demora 2 minutos en renovarse
    socket.on('cooldownBatch', ({ comidaId, tiempoReposicion }) => {
        console.log(`⏳ Lote de comida ${comidaId} agotado. Esperando 2 minutos para reposición.`);
        if (callbacks.onCooldown) callbacks.onCooldown({ comidaId, tiempoReposicion });
    });

    // Cuando pasaron los 2 minutos y se reponen 5 nuevas unidades
    socket.on('restocked', ({ comidaId, unidades }) => {
        console.log(`✅ Lote renovado: 5 nuevas unidades disponibles para ${comidaId}`);
        if (catalogoProductos[comidaId]) {
            catalogoProductos[comidaId].unidades = unidades;
        }
        if (callbacks.onRestocked) callbacks.onRestocked({ comidaId, unidades });
    });
}

/**
 * Función para tomar / reservar una unidad de comida (del 1 al 5)
 * @param {string} unidadId - Identificador de la unidad (ej: 'PIZZA-1')
 */
function tomarProducto(unidadId) {
    if (!socket) return;

    // Deseleccionar si ya estaba seleccionado por este usuario
    if (selectedProducts.has(unidadId)) {
        selectedProducts.delete(unidadId);
        socket.emit('release', unidadId);
    } else {
        // Seleccionar la unidad y reservar por 2 minutos
        selectedProducts.add(unidadId);
        socket.emit('reserve', unidadId);
    }
}

/**
 * Enviar confirmación de compra al servidor
 */
function confirmarCompra() {
    if (!socket) return;
    if (selectedProducts.size > 0) {
        socket.emit('buy', Array.from(selectedProducts));
        selectedProducts.clear();
        stopTimer();
    }
}

/**
 * Mostrar temporizador regresivo para la reserva (2 minutos = 120s)
 */
function starTimer(onTick, onExpire) {
    stopTimer();
    timerInterval = setInterval(() => {
        const diff = Math.max(0, Math.floor((reservationEndTime - Date.now()) / 1000));
        
        if (onTick) {
            onTick(diff);
        } else {
            console.log(`⏱️ Tiempo restante: ${diff}s`);
        }

        if (diff <= 0) {
            stopTimer();
            if (onExpire) onExpire();
        }
    }, 1000);
}

/**
 * Detener el temporizador
 */
function stopTimer(onStop) {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (onStop) onStop();
}

// Exportar funciones para que el frontend (React o Vanilla JS) las importe
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        iniciarWebSocketComidas,
        tomarProducto,
        confirmarCompra,
        starTimer,
        stopTimer,
        selectedProducts
    };
}
