// Servidor con Express + Socket.io para toma y reserva de productos de comida
const express = require('express');
const http = require('http');
const SocketIO = require('socket.io');

// Instanciamos Express
const app = express();
// Crear servidor HTTP con Express
const server = http.createServer(app);

// Crear servidor WebSocket con Socket.io (habilitando CORS para conectar directamente con el frontend de React/Vite)
const io = SocketIO(server, {
    cors: {
        origin: '*', // Permite que el frontend se conecte desde cualquier puerto (ej: localhost:5173)
        methods: ['GET', 'POST']
    }
});

// Tiempo de reserva: 2 minutos (120,000 milisegundos)
const TIEMPO_RESERVA_MS = 2 * 60 * 1000;
// Tiempo de reposición de lote cuando se agotan las 5 unidades: 2 minutos
const TIEMPO_REPOSICION_MS = 2 * 60 * 1000;

// Lista de productos de comida con sus datos para la pantalla
const comidas = [
    { id: 'PIZZA', nombre: 'Pizza Familiar', precio: 12.00, categoria: 'Pizzas' },
    { id: 'BURGER', nombre: 'Hamburguesa Doble', precio: 6.50, categoria: 'Hamburguesas' },
    { id: 'TACOS', nombre: 'Tacos al Pastor', precio: 5.00, categoria: 'Mexicana' },
    { id: 'ALITAS', nombre: 'Alitas BBQ (10 Uds)', precio: 7.00, categoria: 'Pollo' },
    { id: 'SALCHI', nombre: 'Salchipapa Especial', precio: 4.50, categoria: 'Comida Rápida' },
    { id: 'HOTDOG', nombre: 'Hot Dog Supremo', precio: 3.50, categoria: 'Comida Rápida' }
];

// Estado Global de los productos de comida (sala de 5 productos en 5)
let productos = {};

// Inicializar cada comida con una tanda/sala de 5 unidades (1 a 5)
comidas.forEach(comida => {
    productos[comida.id] = {
        info: comida,
        unidades: {},
        tiempoReposicion: 0
    };

    // Crear las 5 unidades de cada comida
    for (let i = 1; i <= 5; i++) {
        const unidadId = `${comida.id}-${i}`;
        productos[comida.id].unidades[unidadId] = {
            id: unidadId,
            numero: i,
            comidaId: comida.id,
            status: 'available', // 'available' | 'reserved' | 'sold'
            user: '',
            expiresAt: 0
        };
    }
});

// Función para verificar si las 5 unidades se vendieron y reponer en 2 minutos
function verificarYReponerLote(comidaId) {
    const prod = productos[comidaId];
    if (!prod) return;

    const todasVendidas = Object.values(prod.unidades).every(u => u.status === 'sold');
    if (todasVendidas && prod.tiempoReposicion === 0) {
        prod.tiempoReposicion = Date.now() + TIEMPO_REPOSICION_MS;
        console.log(`⏱️ Lote de ${prod.info.nombre} agotado. Se repondrán 5 unidades en 2 minutos.`);

        io.emit('cooldownBatch', {
            comidaId,
            tiempoReposicion: prod.tiempoReposicion
        });

        // Esperar 2 minutos para que se vuelva a poder tomar esas comidas
        setTimeout(() => {
            for (let i = 1; i <= 5; i++) {
                const unidadId = `${comidaId}-${i}`;
                prod.unidades[unidadId] = {
                    id: unidadId,
                    numero: i,
                    comidaId: comidaId,
                    status: 'available',
                    user: '',
                    expiresAt: 0
                };
            }
            prod.tiempoReposicion = 0;
            console.log(`✅ Lote de 5 unidades de ${prod.info.nombre} renovado y disponible.`);
            io.emit('restocked', { comidaId, unidades: prod.unidades });
        }, TIEMPO_REPOSICION_MS);
    }
}

// Manejo de conexión de los clientes
io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado vía WebSocket: ${socket.id}`);

    // Enviar estado actual de todos los productos y sus 5 unidades
    socket.emit('init', productos);

    // Registrar el nombre del cliente
    socket.on('setUsername', (username) => {
        socket.username = username ? username.trim() : 'Cliente Anónimo';
        console.log(`👤 Nombre registrado: ${socket.username} (${socket.id})`);
    });

    // Manejar la reserva de productos de comida
    socket.on('reserve', (unidadId) => {
        const [comidaId] = unidadId.split('-');
        const prod = productos[comidaId];
        if (!prod) return;

        const unidad = prod.unidades[unidadId];

        // Verificar si la unidad está disponible
        if (unidad && unidad.status === 'available') {
            unidad.status = 'reserved';
            unidad.user = socket.username || 'Cliente';
            // Tiempo límite de reserva: 2 minutos (120 segundos)
            unidad.expiresAt = Date.now() + TIEMPO_RESERVA_MS;

            console.log(`🟡 [RESERVA]: ${unidad.user} reservó ${unidadId} (expira en 2 min)`);

            // Enviar el evento de reserva a todos los clientes
            io.emit('reserve', {
                unidadId,
                comidaId,
                user: unidad.user,
                expiresAt: unidad.expiresAt
            });

            // Liberar automáticamente luego de los 2 minutos (120 segundos) si no se compra
            setTimeout(() => {
                const uActual = productos[comidaId]?.unidades[unidadId];
                if (uActual && uActual.status === 'reserved' && Date.now() >= uActual.expiresAt) {
                    uActual.status = 'available';
                    uActual.user = '';
                    uActual.expiresAt = 0;
                    console.log(`⏰ [LIBERADO POR TIEMPO]: 2 minutos cumplidos. Se libera ${unidadId}`);
                    io.emit('release', unidadId);
                }
            }, TIEMPO_RESERVA_MS);

        } else {
            // Asiento/Producto no disponible: avisar al cliente para que lo desmarque
            socket.emit('release', unidadId);
        }
    });

    // Liberacion de productos de forma manual
    socket.on('release', (unidadId) => {
        const [comidaId] = unidadId.split('-');
        const unidad = productos[comidaId]?.unidades[unidadId];

        if (unidad && unidad.status === 'reserved' && unidad.user === socket.username) {
            unidad.status = 'available';
            unidad.user = '';
            unidad.expiresAt = 0;
            console.log(`🟢 [LIBERACIÓN MANUAL]: ${socket.username} liberó ${unidadId}`);
            io.emit('release', unidadId);
        }
    });

    // Confirmar la compra de uno o mas productos
    socket.on('buy', (unidadesIds) => {
        if (!Array.isArray(unidadesIds)) return;

        unidadesIds.forEach(unidadId => {
            const [comidaId] = unidadId.split('-');
            const unidad = productos[comidaId]?.unidades[unidadId];

            if (unidad && (unidad.status === 'reserved' && unidad.user === socket.username || unidad.status === 'available')) {
                unidad.status = 'sold';
                unidad.user = socket.username;
                unidad.expiresAt = 0;

                console.log(`🎉 [COMPRADO]: ${socket.username} compró ${unidadId}`);
                io.emit('buy', { unidadId, user: socket.username });

                // Comprobar si las 5 unidades se terminaron para iniciar los 2 minutos de reposición
                verificarYReponerLote(comidaId);
            }
        });
    });

    // Manejo de desconexión del cliente
    socket.on('disconnect', () => {
        console.log(`❌ Cliente desconectado: ${socket.id} (${socket.username || 'sin nombre'})`);
    });
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('========================================================');
    console.log(`🚀 Servidor WebSocket de Comidas activo en http://localhost:${PORT}`);
    console.log('========================================================');
    console.log(`📦 Sala de productos: 5 unidades por comida`);
    console.log(`⏱️ Temporizador: 2 minutos (120 segundos)`);
    console.log(`🌐 CORS habilitado para conectar directamente con el Frontend\n`);
});
