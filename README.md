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

La tabla solicita los pedidos en bloques de 10 usando `limit` y `offset`; la API responde `total`, `limit`, `offset` y `data`. El endpoint limita cada petición a un máximo de 100 registros.

### Ejecución local

Para ver los pedidos de la API sin configurar una cuenta administrativa, desde `frontend` ejecuta `npm run dev` y abre `http://localhost:5173/?demo=admin`. Esta vista previa consulta la API configurada en `URL_PEDIDOS`, pero los cambios de estado son solo locales. La URL sin `?demo=admin` solicita iniciar sesión con un usuario `ADMIN` y usa las rutas administrativas autenticadas.

Para compartir la demostración con compañeros conectados a la misma red Wi-Fi, inicia Vite con `npm run dev -- --host 0.0.0.0` y comparte `http://IP-DE-TU-COMPUTADORA:5173/?demo=admin` (consulta tu IP con `ipconfig`). Es posible que Windows solicite permiso para que otros dispositivos de la red accedan al puerto.

1. Configura `DATABASE_URL` y `JWT_SECRET` en `backend/order-service/.env`. Usa el mismo `JWT_SECRET` en `backend/auth-service/.env`, para que el servicio de pedidos pueda validar el token de inicio de sesión.
2. En `backend/order-service`, ejecuta `npm install` y `npm run dev`.
3. En `frontend/.env`, configura la URL base de la API de pedidos. La variable `URL_PEDIDOS` existente se utiliza directamente:

   ```env
   URL_PEDIDOS=https://tu-api.example.com
   ```

   Si `URL_PEDIDOS` ya existe en el `.env`, conserva su valor. También se admiten `VITE_API_URL` y `VITE_WS_URL` como alternativas. En desarrollo, Vite hace proxy de `/api` y `/ws` a esa URL para evitar errores CORS. En producción, el servidor de la API debe permitir el origen del frontend; el WebSocket se deriva de `URL_PEDIDOS` (`https` se convierte en `wss` y `http` en `ws`).

4. En `frontend`, ejecuta `npm install` y `npm run dev`, e inicia sesión con una cuenta cuyo rol sea `ADMIN`.

El servicio acepta por defecto los orígenes `http://localhost:5173` y `http://127.0.0.1:5173`. Para probar desde otra computadora, configura `FRONTEND_ORIGINS` en el servicio de pedidos con el origen exacto del navegador y apunta `VITE_API_URL`/`VITE_WS_URL` a la dirección IP del equipo que ejecuta el backend. Inicia Vite con `npm run dev -- --host 0.0.0.0` y permite los puertos requeridos en la red/firewall.

El modelo actual solo almacena `clienteId` y no tiene un campo de repartidor; por eso la tabla muestra el identificador de cliente y `Sin asignar` hasta que el backend incorpore esos datos.

## Equipo de Desarrollo

Este proyecto es construido de manera colaborativa por el equipo **J&D**:

* Jilmar
* Dario
* Joselyn
* Dereck