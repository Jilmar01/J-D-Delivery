# Concurrency TCP Service - J&D Delivery

Parte de **Dario** (Backend 2): asignación concurrente de pedidos y comunicación entre procesos mediante sockets TCP.

```text
concurrency-tcp-service/
├── server.js                  # Servidor TCP
├── src/
│   ├── asignacion.js          # Asignación atómica en PostgreSQL
│   ├── protocolo.js           # Formato de mensajes TCP (documentado en la cabecera)
│   ├── tcp-client.js          # Cliente TCP para enviar mensajes entre procesos
│   └── concurrencia.js        # N repartidores simultáneos sobre un mismo pedido
├── test/concurrencia.test.js  # Pruebas automáticas
├── env.example                # Variables de entorno
└── package.json
```

## 1. Cómo se garantiza la concurrencia (BE2-01 a BE2-03)

Node.js procesa las solicitudes de forma asíncrona, pero eso **no** basta para proteger datos compartidos entre procesos o computadoras. La protección está en PostgreSQL. Trabaja sobre la base de `delivery-service` (`deliveries` y `delivery_history`). En ese esquema `courierId` es obligatorio, así que no hay una fila `PENDING` que actualizar: **la entrega se crea al asignar**, dentro de una transacción que toma un bloqueo exclusivo por pedido:

```sql
BEGIN;
SELECT pg_advisory_xact_lock(7101, :pedidoId);                       -- serializa por pedido
SELECT status FROM deliveries WHERE "orderId" = :pedidoId AND status <> 'CANCELLED';
--   si hay fila  -> ROLLBACK, rechazada (YA_ASIGNADO)
INSERT INTO deliveries ("orderId","courierId","deliveryAddress",status,...) VALUES (..., 'ASSIGNED', ...);
INSERT INTO delivery_history ("deliveryId","previousStatus","newStatus",notes) VALUES (..., NULL, 'ASSIGNED', ...);
COMMIT;                                                              -- libera el bloqueo
```

- **Entrega creada** → asignación exitosa.
- **Ya existía una entrega activa** → se rechaza (`YA_ASIGNADO`).

Si dos solicitudes llegan a la vez, la segunda espera en el bloqueo hasta que la primera hace `COMMIT`; al leer de nuevo ya ve la entrega y se rechaza. El bloqueo vive en PostgreSQL, por eso protege aunque las solicitudes vengan de procesos o computadoras distintas. El código está en [src/asignacion.js](src/asignacion.js) (`PostgresStore.asignar`).

El índice único `deliveries_orderId_key` (sobre `orderId`) es una segunda barrera en la propia base: aunque fallara el bloqueo, un segundo `INSERT` del mismo pedido se rechazaría. Consecuencia: un pedido tiene como máximo una entrega, incluso si se cancela.

## 2. Protocolo TCP (BE2-07)

Un mensaje JSON por línea, terminado en `\n`. TCP es un flujo de bytes, por eso el servidor acumula datos y procesa solo líneas completas (probado con mensajes partidos y varios por envío).

| Solicitud | Respuesta |
|---|---|
| `{"tipo":"ASIGNAR_PEDIDO","pedidoId":1,"repartidorId":7,"direccion":"..."}` (`direccion` opcional) | `{"tipo":"ASIGNACION_OK","pedidoId":1,"repartidorId":7,"estado":"ASSIGNED"}` |
| | `{"tipo":"ASIGNACION_RECHAZADA","pedidoId":1,"motivo":"YA_ASIGNADO"}` |
| `{"tipo":"CONSULTAR_PEDIDO","pedidoId":1}` | `{"tipo":"PEDIDO","pedido":{"id":1,"estado":"ASSIGNED","repartidorId":7}}` |
| `{"tipo":"PEDIDO_ASIGNADO","pedidoId":1,"repartidorId":7}` (cualquier otro evento) | `{"tipo":"ACK","evento":"PEDIDO_ASIGNADO"}` |
| mensaje mal formado | `{"tipo":"ERROR","motivo":"JSON_INVALIDO" \| "CAMPOS_INVALIDOS" \| "INTERNO","detalle":"..."}` |

## 3. Instalación y ejecución (BE2-10)

Requiere la base de `delivery-service` con sus migraciones aplicadas (`npx prisma migrate dev` en `delivery-service`).

```powershell
cd backend/concurrency-tcp-service
npm install
$env:DATABASE_URL = "postgresql://postgres:tu_clave@IP_DE_POSTGRES:5432/delivery_delivery_db"
npm start
```

### Enviar mensajes desde otro proceso (BE2-06)
```powershell
npm run enviar -- ASIGNAR_PEDIDO 1 7
npm run enviar -- CONSULTAR_PEDIDO 1
npm run enviar -- EVENTO PEDIDO_ASIGNADO 1 7
```

### Concurrencia: solicitudes simultáneas contra el servidor en marcha
Lanza 10 repartidores a la vez sobre el pedido 1 y comprueba que solo uno gana. Con `DATABASE_URL` definida, borra antes la entrega de ese pedido, así que se puede repetir:
```powershell
npm run concurrencia -- 1 10
```

## 4. Pruebas automáticas (BE2-04)

```powershell
npm test
```
- 50 repartidores simultáneos sobre el mismo pedido: exactamente 1 asignación y 49 rechazos.
- 20 pedidos distintos en paralelo, y pedido inexistente rechazado.
- Mensajes inválidos, eventos con `ACK` y delimitación por `\n`.

Se ejecutan contra PostgreSQL simulado (`pg-mem`) con el esquema de `delivery_db`. **`pg-mem` valida la sintaxis y la lógica del SQL, pero no el bloqueo real de filas.** Para probar contra el PostgreSQL real, define `DATABASE_URL` antes de `npm test` y las pruebas se repiten también contra él.

## 4.1 Asignación por cercanía (repartidores conectados por TCP)

El repartidor es un proceso con la conexión TCP abierta. Se registra con su ubicación, y cuando llega un `NUEVO_PEDIDO` el servidor lo **ofrece a los 3 repartidores disponibles más cercanos** (radio 10 km). El primero que acepta intenta el `UPDATE` atómico; los demás reciben `PEDIDO_TOMADO`. Si nadie acepta en 15 s (o todos rechazan), se ofrece a los siguientes más cercanos. Los repartidores viven en memoria: si el servidor se reinicia deben reconectarse. La cercanía se mide contra el punto de **salida** del pedido (`lat`/`lng` de `NUEVO_PEDIDO`: el local); el punto de entrega (`entregaLat`/`entregaLng`) solo se reenvía en la oferta. Mensajes: ver `src/protocolo.js`.

```powershell
# Terminal 1: servidor
npm start
# Terminales 2 y 3: repartidores (id, lat, lng); con --auto aceptan solos
npm run repartidor -- 1 -0.1807 -78.4678
npm run repartidor -- 2 -0.1900 -78.4700 --auto
# Terminal 4: pedido nuevo (pedidoId, lat, lng, dirección)
npm run enviar -- NUEVO_PEDIDO 1 -0.1810 -78.4680 "Quito, centro"   # lat/lng = salida (local)
```
Pruebas: `test/cercania.test.js` (usa una base simulada en memoria).

## 5. Red con las cuatro computadoras (BE2-09)

El servidor escucha en `0.0.0.0:12345`, así que acepta conexiones desde otras PCs de la red.

1. **Obtener la IP del servidor** (en la PC que ejecuta `npm start`): `ipconfig` → "Dirección IPv4" del adaptador Wi-Fi (ej. `192.168.1.20`).
2. **Abrir el puerto en el firewall** de esa PC (PowerShell como administrador):
   ```powershell
   New-NetFirewallRule -DisplayName "JD Delivery TCP 12345" -Direction Inbound -Protocol TCP -LocalPort 12345 -Action Allow
   ```
3. **Desde otra PC**, apuntar el cliente a esa IP:
   ```powershell
   $env:TCP_HOST = "192.168.1.20"
   npm run enviar -- CONSULTAR_PEDIDO 1
   npm run concurrencia -- 1 10
   ```
4. **PostgreSQL en otra PC**: debe aceptar conexiones de la red (`listen_addresses = '*'` en `postgresql.conf`, una línea de la red local en `pg_hba.conf` y el puerto 5432 abierto en el firewall), y `DATABASE_URL` debe usar su IP.
5. Verificar la conectividad: `Test-NetConnection 192.168.1.20 -Port 12345`.

Todas las PCs deben estar en la misma red Wi-Fi.

## 6. Integración con order-service (BE2-08)

`order-service` (puerto 3001) usa este servidor por TCP (`TCP_HOST`/`TCP_PORT` en su `.env`; ver `order-service/env.example`):

- **`POST /api/orders`** con `deliveryLat`/`deliveryLng`: crea el pedido y envía `NUEVO_PEDIDO` (con el punto de salida `PICKUP_LAT`/`PICKUP_LNG`) para ofrecerlo a los repartidores más cercanos. La respuesta incluye `oferta.enviada`.
- **`POST /api/orders/:id/assign`** con `{ "courierId": 7 }`: envía `ASIGNAR_PEDIDO`. `200` si lo obtiene (el pedido pasa a `CONFIRMED`, que equivale a "asignado"), `409` si ya fue tomado, `503` si este servidor no responde.

Limitación actual:
- Una aceptación hecha por un repartidor TCP (`npm run repartidor`) crea la entrega pero no actualiza `orders.status`, porque este servicio no accede a la base de pedidos. Solo la ruta HTTP `/assign` lo actualiza.

## 7. Cambios de base de datos aplicados

Hay que correr las migraciones nuevas (cada servicio con su `.env`):

```powershell
cd backend/order-service     ; npx prisma migrate dev   # orders.deliveryLat / deliveryLng (Decimal 9,6, opcionales)
cd backend/delivery-service  ; npx prisma migrate dev   # deliveries.courierId opcional + índice único sobre orderId
```
