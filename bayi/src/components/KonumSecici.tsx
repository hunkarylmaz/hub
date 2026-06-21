import { useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { LocateFixed } from 'lucide-react'
import { createKonumIcon } from '../lib/mapUtils'

const TURKIYE_MERKEZ: [number, number] = [39.9334, 32.8597]

interface KonumSeciciProps {
  lat: number | null
  lon: number | null
  onChange: (lat: number, lon: number) => void
  center?: [number, number]
  height?: number
}

function ClickHandler({ onPick }: { onPick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function KonumSecici({ lat, lon, onChange, center, height = 240 }: KonumSeciciProps) {
  const [locating, setLocating] = useState(false)
  const secili = lat != null && lon != null
  const initialCenter: [number, number] = secili ? [lat, lon] : (center ?? TURKIYE_MERKEZ)

  function konumumuKullan() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => { onChange(pos.coords.latitude, pos.coords.longitude); setLocating(false) },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  return (
    <div>
      <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height }}>
        <MapContainer
          key={secili ? 'secili' : `oneri-${initialCenter[0]}-${initialCenter[1]}`}
          center={initialCenter}
          zoom={secili ? 15 : 12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> katkıda bulunanlar'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <ClickHandler onPick={onChange} />
          {secili && (
            <Marker
              position={[lat, lon]}
              icon={createKonumIcon()}
              draggable
              eventHandlers={{
                dragend: e => {
                  const p = e.target.getLatLng()
                  onChange(p.lat, p.lng)
                },
              }}
            />
          )}
        </MapContainer>
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-500">
          {secili ? `${lat.toFixed(6)}, ${lon.toFixed(6)}` : 'Haritada bir nokta seçin veya işaretçiyi sürükleyin'}
        </p>
        <button type="button" onClick={konumumuKullan} disabled={locating}
          className="text-xs font-medium px-2.5 py-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-md flex items-center gap-1.5 disabled:opacity-50 shrink-0">
          <LocateFixed size={12} /> {locating ? 'Bulunuyor...' : 'Mevcut Konum'}
        </button>
      </div>
    </div>
  )
}
