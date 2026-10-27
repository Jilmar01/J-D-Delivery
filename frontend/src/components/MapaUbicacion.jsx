import { useCallback, useEffect, useRef, useState } from 'react'
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'

const CENTRO_ECUADOR = [-1.8312, -78.1834]
let siguienteSolicitudNominatim = 0

const iconoMarcador = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

async function consultarNominatim(url) {
  const horaProgramada = Math.max(Date.now(), siguienteSolicitudNominatim)
  siguienteSolicitudNominatim = horaProgramada + 1100
  await new Promise((resolver) =>
    setTimeout(resolver, Math.max(0, horaProgramada - Date.now()))
  )

  const respuesta = await fetch(url, {
    headers: { 'Accept-Language': 'es' },
  })
  if (!respuesta.ok) {
    throw new Error(`Nominatim respondió con HTTP ${respuesta.status}`)
  }

  return respuesta.json()
}

function MoverMapa({ ubicacion }) {
  const mapa = useMap()

  useEffect(() => {
    mapa.flyTo([ubicacion.lat, ubicacion.lng], 16, { duration: 0.5 })
  }, [mapa, ubicacion.lat, ubicacion.lng])

  return null
}

function SeleccionarMapa({ alSeleccionar }) {
  useMapEvents({
    click(event) {
      alSeleccionar(event.latlng)
    },
  })

  return null
}

function MapaUbicacion({
  ubicacionPendiente,
  ubicacionConfirmada,
  alCambiarUbicacionPendiente,
  alConfirmarUbicacion,
}) {
  const numeroSolicitud = useRef(0)
  const [consulta, setConsulta] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState('')
  const [errorMapa, setErrorMapa] = useState(false)

  useEffect(() => {
    if (!ubicacionPendiente) {
      numeroSolicitud.current += 1
    }
  }, [ubicacionPendiente])

  const buscarDireccion = useCallback(
    async () => {
      const texto = consulta.trim()
      if (!texto || buscando) return

      setBuscando(true)
      setError('')
      setResultados([])

      try {
        const parametros = new URLSearchParams({
          q: texto,
          format: 'jsonv2',
          addressdetails: '1',
          limit: '5',
          countrycodes: 'ec',
        })
        const lugares = await consultarNominatim(
          `https://nominatim.openstreetmap.org/search?${parametros}`
        )

        if (!lugares.length) {
          setError('No se encontraron direcciones. Prueba con otra búsqueda.')
        } else {
          setResultados(lugares)
        }
      } catch {
        setError(
          'No se pudo buscar la dirección. Puedes seleccionar el punto en el mapa o escribir la dirección manualmente.'
        )
      } finally {
        setBuscando(false)
      }
    },
    [buscando, consulta]
  )

  const seleccionarPunto = useCallback(
    async ({ lat, lng }, direccion = '') => {
      const idSolicitud = ++numeroSolicitud.current
      const coordenadas = { lat: Number(lat), lng: Number(lng) }
      alCambiarUbicacionPendiente({
        ...coordenadas,
        direccion: direccion || 'Buscando dirección…',
      })
      setResultados([])
      setError('')

      if (direccion) return

      try {
        const parametros = new URLSearchParams({
          lat: String(coordenadas.lat),
          lon: String(coordenadas.lng),
          format: 'jsonv2',
          addressdetails: '1',
        })
        const lugar = await consultarNominatim(
          `https://nominatim.openstreetmap.org/reverse?${parametros}`
        )

        if (idSolicitud !== numeroSolicitud.current) return

        if (!lugar.display_name) {
          alCambiarUbicacionPendiente({
            ...coordenadas,
            direccion: '',
          })
          setError('No se encontró una dirección para este punto.')
          return
        }

        alCambiarUbicacionPendiente({
          ...coordenadas,
          direccion: lugar.display_name,
        })
      } catch {
        if (idSolicitud === numeroSolicitud.current) {
          alCambiarUbicacionPendiente({
            ...coordenadas,
            direccion: '',
          })
          setError(
            'No se pudo obtener la dirección de este punto. Puedes escribirla manualmente.'
          )
        }
      }
    },
    [alCambiarUbicacionPendiente]
  )

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-700">
        Buscar dirección en el mapa
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="buscar-direccion-mapa" className="sr-only">
          Buscar una dirección en OpenStreetMap
        </label>
        <input
          id="buscar-direccion-mapa"
          type="search"
          value={consulta}
          onChange={(event) => setConsulta(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              buscarDireccion()
            }
          }}
          placeholder="Escribe una dirección o lugar"
          autoComplete="street-address"
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
        />
        <button
          type="button"
          onClick={buscarDireccion}
          disabled={buscando || !consulta.trim()}
          className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {buscando ? 'Buscando…' : 'Buscar'}
        </button>
      </div>
      <p className="text-xs leading-5 text-slate-500">
        Busca una dirección o toca el mapa; puedes arrastrar el marcador para
        ajustar el punto. La búsqueda se limita a Ecuador.
      </p>

      {resultados.length > 0 && (
        <ul
          aria-label="Resultados de búsqueda"
          className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          {resultados.map((lugar) => (
            <li key={lugar.place_id}>
              <button
                type="button"
                onClick={() =>
                  seleccionarPunto(
                    { lat: lugar.lat, lng: lugar.lon },
                    lugar.display_name
                  )
                }
                className="w-full border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-700 transition last:border-b-0 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
              >
                {lugar.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="h-64 w-full overflow-hidden rounded-2xl border border-slate-200 sm:h-80">
        <MapContainer
          center={CENTRO_ECUADOR}
          zoom={6}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            eventHandlers={{
              tileerror: () => setErrorMapa(true),
              tileload: () => setErrorMapa(false),
            }}
          />
          <SeleccionarMapa
            alSeleccionar={(punto) => seleccionarPunto(punto)}
          />
          {ubicacionPendiente && (
            <>
              <MoverMapa ubicacion={ubicacionPendiente} />
              <Marker
                position={[
                  ubicacionPendiente.lat,
                  ubicacionPendiente.lng,
                ]}
                icon={iconoMarcador}
                draggable
                eventHandlers={{
                  dragend(event) {
                    seleccionarPunto(event.target.getLatLng())
                  },
                }}
              />
            </>
          )}
        </MapContainer>
      </div>

      {errorMapa && (
        <p
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
        >
          No se pudieron cargar algunas imágenes del mapa. Puedes intentar
          seleccionar un punto o continuar con la dirección manual.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
        >
          {error}
        </p>
      )}

      {ubicacionPendiente && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
          <p className="text-sm font-semibold text-slate-800">
            Ubicación seleccionada
          </p>
          <p className="mt-1 break-words text-sm text-slate-600">
            {ubicacionPendiente.direccion || 'Dirección no disponible'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Latitud: {ubicacionPendiente.lat.toFixed(6)} · Longitud:{' '}
            {ubicacionPendiente.lng.toFixed(6)}
          </p>
          <button
            type="button"
            onClick={() => alConfirmarUbicacion(ubicacionPendiente)}
            className="mt-3 w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-600/20 sm:w-auto"
          >
            Confirmar ubicación
          </button>
        </div>
      )}

      {ubicacionConfirmada && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"
        >
          <p className="text-sm font-semibold text-emerald-900">
            Ubicación confirmada
          </p>
          <p className="mt-1 break-words text-sm text-emerald-800">
            {ubicacionConfirmada.direccion || 'Dirección no disponible'}
          </p>
          <p className="mt-1 text-xs text-emerald-700">
            Latitud: {ubicacionConfirmada.lat.toFixed(6)} · Longitud:{' '}
            {ubicacionConfirmada.lng.toFixed(6)}
          </p>
          <p className="mt-2 text-xs leading-5 text-emerald-800">
            La ubicación se conserva en esta interfaz y no se envía al backend.
          </p>
        </div>
      )}
    </div>
  )
}

export default MapaUbicacion
