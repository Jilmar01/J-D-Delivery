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

Node.js procesa las solicitudes de forma asíncrona, pero eso **no** basta para proteger datos compartidos entre procesos o computadoras. La protección está en PostgreSQL, con una única sentencia atómica:

```sql
UPDATE "Pedido"
   SET "repartidorId" = $1, estado = 'ASIGNADO', "updatedAt" = now()
 WHERE id = $2 AND estado = 'PENDIENTE' AND "repartidorId" IS NULL
RETURNING id, "repartidorId", estado;
```

- **1 fila devuelta** → asignación exitosa.
- **0 filas** → el pedido no existe o ya no está disponible. Se rechaza (`YA_ASIGNADO`, `NO_ENCONTRADO` o `ESTADO_INVALIDO`).

Si dos solicitudes llegan a la vez, PostgreSQL bloquea la fila: la segunda espera, vuelve a evaluar el `WHERE`, ya no ve el pedido `PENDIENTE` y no actualiza nada. El código está en [src/asignacion.js](src/asignacion.js) (`PostgresStore.asignar`). PostgreSQL es la fuente de verdad.

## 2. Protocolo TCP (BE2-07)

Un mensaje JSON por línea, terminado en `\n`. TCP es un flujo de bytes, por eso el servidor acumula datos y procesa solo líneas completas (probado con mensajes partidos y varios por envío).

| Solicitud | Respuesta |
|---|---|
| `{"tipo":"ASIGNAR_PEDIDO","pedidoId":1,"repartidorId":7}` | `{"tipo":"ASIGNACION_OK","pedidoId":1,"repartidorId":7,"estado":"ASIGNADO"}` |
| | `{"tipo":"ASIGNACION_RECHAZADA","pedidoId":1,"motivo":"YA_ASIGNADO"}` |
| `{"tipo":"CONSULTAR_PEDIDO","pedidoId":1}` | `{"tipo":"PEDIDO","pedido":{"id":1,"estado":"ASIGNADO","repartidorId":7}}` |
| `{"tipo":"PEDIDO_ASIGNADO","pedidoId":1,"repartidorId":7}` (cualquier otro evento) | `{"tipo":"ACK","evento":"PEDIDO_ASIGNADO"}` |
| mensaje mal formado | `{"tipo":"ERROR","motivo":"JSON_INVALIDO" \| "CAMPOS_INVALIDOS" \| "INTERNO","detalle":"..."}` |

## 3. Instalación y ejecución (BE2-10)

Requiere la base de datos con los cambios de la sección 6.

```powershell
cd backend/concurrency-tcp-service
npm install
$env:DATABASE_URL = "postgresql://postgres:tu_clave@IP_DE_POSTGRES:5432/delivery_order_db"
npm start
```

### Enviar mensajes desde otro proceso (BE2-06)
```powershell
npm run enviar -- ASIGNAR_PEDIDO 1 7
npm run enviar -- CONSULTAR_PEDIDO 1
npm run enviar -- EVENTO PEDIDO_ASIGNADO 1 7
```

### Concurrencia: solicitudes simultáneas contra el servidor en marcha
Lanza 10 repartidores a la vez sobre el pedido 1 y comprueba que solo uno gana. Con `DATABASE_URL` definida, deja el pedido en `PENDIENTE` antes de cada ejecución, así que se puede repetir:
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

Se ejecutan contra PostgreSQL simulado (`pg-mem`) con el esquema de la base de Jilmar. **`pg-mem` valida la sintaxis y la lógica del SQL, pero no el bloqueo real de filas.** Para probar contra el PostgreSQL real, define `DATABASE_URL` antes de `npm test` y las pruebas se repiten también contra él.

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

## 6. Cambios necesarios en la base de datos (BE2-08)

La asignación trabaja sobre la tabla `"Pedido"` de `delivery_order_db`. Hay que ejecutar este script **una sola vez** (se puede repetir sin problema):

```sql
-- Nuevo estado: pedido tomado por un repartidor
ALTER TYPE "EstadoPedido" ADD VALUE IF NOT EXISTS 'ASIGNADO';

-- Estados del plan (opcionales; quitar si no se usan)
ALTER TYPE "EstadoPedido" ADD VALUE IF NOT EXISTS 'EN_CAMINO';
ALTER TYPE "EstadoPedido" ADD VALUE IF NOT EXISTS 'ENTREGADO';

-- Repartidor asignado (NULL = sin asignar)
ALTER TABLE "Pedido" ADD COLUMN IF NOT EXISTS "repartidorId" BIGINT;
```

En PostgreSQL anterior a la 12, ejecutar los `ALTER TYPE` uno por uno, fuera de una transacción.

**Para quien mantiene `order-service`:**
- Si usa `prisma migrate`, debe añadir `repartidorId BigInt?` y `ASIGNADO` también al modelo `Pedido`, o la próxima migración eliminará lo añadido.
- `PATCH /api/pedidos/:id/estado` no debe permitir asignar repartidores: la asignación se hace solo con esta operación, para no tener dos reglas distintas.
- Estados: la base tiene `PENDIENTE`, `EN_PROCESO`, `COMPLETADO` y `CANCELADO`; el plan usa `PENDIENTE → ASIGNADO → EN_CAMINO → ENTREGADO`. Este servicio solo necesita `PENDIENTE` y `ASIGNADO`.

Si algún nombre de la base cambia, se ajusta con `PEDIDOS_TABLE`, `PEDIDOS_COL_REPARTIDOR` y `PEDIDOS_COL_ACTUALIZADO` (por defecto: `Pedido`, `repartidorId`, `updatedAt`).

El evento WebSocket `PEDIDO_ASIGNADO` lo publica el backend. Puede hacerlo llamando a este servicio con `enviarMensaje({ tipo: 'ASIGNAR_PEDIDO', ... })` desde `src/tcp-client.js` y publicando el evento cuando la respuesta sea `ASIGNACION_OK`.
