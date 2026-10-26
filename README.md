# J&D Delivery

J&D Delivery es un sistema distribuido de gestión de pedidos y entregas diseñado para optimizar la logística, el seguimiento en tiempo real y la escalabilidad operativa. 

Esta plataforma logística está construida sobre una arquitectura distribuida que garantiza alta disponibilidad y tolerancia a fallos en la gestión de envíos. El sistema coordina de manera eficiente el ciclo de vida completo de los pedidos, conectando los nodos de distribución con los repartidores y los clientes finales mediante comunicación en tiempo real.

## Características Principales

* **Procesamiento Asíncrono:** Capacidad para manejar picos de demanda y alto volumen de pedidos sin degradar el rendimiento del sistema.
* **Gestión Dinámica de Rutas:** Asignación inteligente de entregas basada en la ubicación actual y la disponibilidad de la flota de repartidores.
* **Sincronización en Tiempo Real:** Actualización constante de estados para mantener informados a todos los actores de la cadena logística (cliente final, repartidor y centro de distribución).
* **Alta Disponibilidad:** Arquitectura distribuida pensada para ser tolerante a fallos y mantener la continuidad del negocio.

## Panel administrativo de pedidos

El rol `ADMIN` dispone de una tabla de pedidos con filtros por estado, acciones para avanzar por las transiciones permitidas y actualización en tiempo real. El panel consulta `GET /api/pedidos`, cambia estados mediante `PATCH /api/pedidos/:id/estado` y escucha eventos WebSocket en `/ws`. El servicio publica `PEDIDO_CREADO` y `PEDIDO_ACTUALIZADO` después de guardar cada cambio en PostgreSQL.

### Ejecución local

Para enseñar una vista rápida sin configurar una cuenta ni la base de datos, desde `frontend` ejecuta `npm run dev` y abre `http://localhost:5173/?demo=admin`. Este modo muestra pedidos ficticios, permite probar filtros y cambios de estado localmente y solo está disponible con el servidor de desarrollo de Vite; no usa la API ni WebSockets.

Para compartir la demostración con compañeros conectados a la misma red Wi-Fi, inicia Vite con `npm run dev -- --host 0.0.0.0` y comparte `http://IP-DE-TU-COMPUTADORA:5173/?demo=admin` (consulta tu IP con `ipconfig`). Es posible que Windows solicite permiso para que otros dispositivos de la red accedan al puerto.

1. Configura `DATABASE_URL` y `JWT_SECRET` en `backend/order-service/.env`. Usa el mismo `JWT_SECRET` en `backend/auth-service/.env`, para que el servicio de pedidos pueda validar el token de inicio de sesión.
2. En `backend/order-service`, ejecuta `npm install` y `npm run dev`.
3. En `frontend/.env.local`, configura:

   ```env
   VITE_API_URL=http://localhost:3001
   VITE_WS_URL=ws://localhost:3001/ws
   ```

4. En `frontend`, ejecuta `npm install` y `npm run dev`, e inicia sesión con una cuenta cuyo rol sea `ADMIN`.

El servicio acepta por defecto los orígenes `http://localhost:5173` y `http://127.0.0.1:5173`. Para probar desde otra computadora, configura `FRONTEND_ORIGINS` en el servicio de pedidos con el origen exacto del navegador y apunta `VITE_API_URL`/`VITE_WS_URL` a la dirección IP del equipo que ejecuta el backend. Inicia Vite con `npm run dev -- --host 0.0.0.0` y permite los puertos requeridos en la red/firewall.

El modelo actual solo almacena `clienteId` y no tiene un campo de repartidor; por eso la tabla muestra el identificador de cliente y `Sin asignar` hasta que el backend incorpore esos datos.

## Equipo de Desarrollo

Este proyecto es construido de manera colaborativa por el equipo **J&D**:

* Jilmar
* Dario
* Joselyn
* Dereck