# J-D Delivery frontend

## Selección de ubicación con OpenStreetMap

El formulario usa Leaflet y OpenStreetMap para mostrar el mapa y permite buscar
direcciones con el servicio público de Nominatim. No necesita una clave de
Google ni variables de entorno. La ubicación elegida se conserva en el estado
de la interfaz y no se agrega a la solicitud actual de pedidos.

Las búsquedas y consultas de dirección se ejecutan al enviar la búsqueda o
seleccionar/mover un punto, no como autocompletado por cada pulsación. Las
consultas se espacian para respetar el límite de uso del servicio público. El
servicio puede limitarse o no estar disponible; en ese caso, la dirección
manual del formulario sigue funcionando. OpenStreetMap requiere atribución,
que se muestra junto al mapa.

## Herramientas de React + Vite

Este proyecto usa Vite para ejecutar React y ESLint para validar el código.

- `npm run dev`: inicia el servidor de desarrollo.
- `npm run lint`: ejecuta ESLint.
- `npm run build`: genera el build de producción.
