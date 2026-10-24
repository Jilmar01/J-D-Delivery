## Backend — J&D Delivery

### Tecnologías

- Node.js
- Express
- dotenv
- PostgreSQL (integración pendiente)

### Microservicios

| Servicio | Puerto | Endpoint de salud |
|---|---:|---|
| order-service | 3001 | `/health` |
| delivery-service | 3002 | `/health` |
| auth-service | 3003 | `/health` |
| notification-service | 3004 | `/health` |

### Requisitos

- Node.js instalado.
- npm instalado.
- Repositorio clonado en el equipo.

### Ejecución

Cada microservicio debe iniciarse desde su propio directorio.

Ejemplo para el servicio de pedidos:

```bash
cd backend/order-service
npm install
npm run dev
```

Para iniciar los otros servicios, sustituye `order-service` por el nombre del directorio correspondiente.

### Verificación

Con el servicio de pedidos en ejecución, visita:

`http://localhost:3001/health`

Cada microservicio dispone de su propio servidor Express y configuración de entorno.