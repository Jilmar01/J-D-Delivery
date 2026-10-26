# Concurrency TCP Service - Chat J&D Delivery

Servicio de comunicación en tiempo real mediante Sockets TCP nativos de Node.js (`net`), desarrollado para permitir la mensajería instantánea entre **Clientes** y **Repartidores** dentro de la plataforma distribuida **J&D Delivery**.

## Características
- **100% Nativo**: Sin dependencias externas pesadas, utiliza los módulos nativos `net` y `readline` de Node.js.
- **Identificación por Roles**: Soporte para roles `CLIENTE` y `REPARTIDOR`.
- **Servidor Central**: Registra en consola todos los mensajes emitidos y su autor en tiempo real.
- **Broadcast Inteligente**: Los mensajes se retransmiten en tiempo real entre los participantes conectados.
- **Tolerancia a Desconexiones**: Manejo seguro de eventos `error` (`ECONNRESET`) y desconexiones limpias con el comando `salir`.

## Archivos del Módulo
```text
concurrency-tcp-service/
├── server.js         # Servidor TCP central
├── src/
│   └── client.js     # Cliente interactivo (Cliente / Repartidor)
├── package.json      # Configuración del paquete y scripts
└── README.md         # Documentación del servicio
```

## Instrucciones de Ejecución

### 1. Iniciar el Servidor
```bash
node server.js
```
*O usando npm:*
```bash
npm start
```

### 2. Conectar Clientes / Repartidores
Abre una nueva terminal por cada participante:
```bash
node src/client.js
```
*O usando npm:*
```bash
npm run client
```

Al iniciar el cliente, el sistema te solicitará:
1. **Seleccionar tu Rol**:
   - `1`: Cliente
   - `2`: Repartidor
2. **Ingresar tu Nombre de Usuario** (ej. *Dario*, *Carlos*).

### 3. Uso del Chat
- Escribe tu mensaje y presiona `Enter` para enviarlo.
- Para desconectarte limpiamente, escribe: `salir`.


## Dónde se aplica la concurrencia
- **Modelo**: un único hilo con *event loop* (I/O no bloqueante). `net.createServer` ejecuta el callback por cada conexión entrante, por lo que varios clientes se atienden simultáneamente (`server.js`, `net.createServer`).
- **Estado compartido**: el `Map` `clientes` (socket → usuario) se actualiza en los eventos `data`, `close` y `error` de cada socket. Al no haber hilos, no hay condiciones de carrera.
- **Broadcast**: la función `broadcast()` recorre los sockets conectados y escribe en cada uno con `socket.write`.
- **Cliente** (`src/client.js`): `readline` (entrada de usuario) y `socket.on('data')` (mensajes entrantes) corren a la vez gracias a los eventos.
