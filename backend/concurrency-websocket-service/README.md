# Concurrency WebSocket Service - J&D Delivery

Servicio WebSocket en tiempo real desarrollado con **Express** y **Socket.io** para la reserva y compra concurrente de productos de comida.

---

## 🎯 Lógica del Servicio

- **Lotes de 5 en 5**: Cada producto de comida cuenta con una tanda de **5 unidades/porciones** (`PROD-1` a `PROD-5`).
- **Temporizador de 2 minutos (120 segundos)**: 
  - Al reservar un producto (`reserve`), queda bloqueado para ese usuario durante **2 minutos**.
  - Si no se confirma la compra dentro de los 2 minutos, el servidor lo libera automáticamente (`release`) para que otro usuario lo pueda tomar.
- **Renovación de Lote**:
  - Cuando se agotan las 5 unidades de un producto, el servidor inicia un tiempo de espera de **2 minutos** para reponer una nueva tanda de 5 unidades (`restocked`).

---

## 🚀 Cómo Iniciar el Servidor

```bash
cd backend/concurrency-websocket-service
npm start
```
*El servidor correrá en `http://localhost:3000` con CORS habilitado para conectarse con el Frontend (React/Vite).*

---

## 📡 Eventos WebSocket (Para conectar con el Frontend)

Tus compañeros del frontend solo necesitan usar `socket.io-client` para conectarse a `http://localhost:3000`:

### Eventos que el Frontend **Envía** al Servidor:
| Evento | Parámetro | Descripción |
|---|---|---|
| `setUsername` | `username` (string) | Registra el nombre del usuario logueado. |
| `reserve` | `unidadId` (string, ej: `'PIZZA-1'`) | Toma/reserva una porción de comida por 2 minutos. |
| `release` | `unidadId` (string) | Libera manualmente la unidad si el usuario la deselecciona. |
| `buy` | `[unidadId1, unidadId2, ...]` (array) | Confirma la compra de las unidades seleccionadas. |

### Eventos que el Frontend **Recibe** del Servidor:
| Evento | Parámetro | Descripción |
|---|---|---|
| `init` | `productos` (objeto) | Envía el estado inicial de todas las comidas y sus 5 unidades. |
| `reserve` | `{ unidadId, comidaId, user, expiresAt }` | Notifica que un usuario tomó un producto (inicia timer de 2 min). |
| `release` | `unidadId` | Notifica que el producto volvió a estar disponible. |
| `buy` | `{ unidadId, user }` | Notifica que el producto fue vendido. |
| `cooldownBatch` | `{ comidaId, tiempoReposicion }` | Notifica que el lote de 5 se agotó (2 min de espera). |
| `restocked` | `{ comidaId, unidades }` | Notifica que llegaron 5 nuevas unidades del producto. |


---

## 🗂️ Estructura
```text
concurrency-websocket-service/
├── server.js        # Servidor Express + Socket.io
├── src/
│   └── client.js    # Lógica de cliente Socket.io para el Frontend
├── package.json
└── README.md
```

## ⚙️ Dónde se aplica la concurrencia
- **Modelo**: un hilo con *event loop*; `io.on('connection')` en `server.js` atiende a todos los clientes a la vez.
- **Exclusión sobre recursos compartidos**: `productos` es el estado global. En `reserve`, la comprobación `unidad.status === 'available'` y el cambio a `'reserved'` ocurren en el mismo turno del event loop (sin `await`), por lo que dos usuarios no pueden reservar la misma unidad. Si pierde, recibe `release`.
- **Temporizadores concurrentes**: un `setTimeout` por reserva (libera a los 2 min) y otro por lote agotado (`verificarYReponerLote`, repone a los 2 min).
- **Sincronización en tiempo real**: `io.emit(...)` difunde `reserve`, `release`, `buy`, `cooldownBatch` y `restocked` a todos los clientes conectados.
