import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { Bike, Users, Coffee, WifiOff } from 'lucide-react'

// Fix leaflet default icon issue with Vite bundling
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export const DURUM_COLORS: Record<string, { bg: string; text: string; border: string; icon: typeof Bike; label: string }> = {
  'Dağıtımda':  { bg: '#3B82F6', text: '#fff', border: '#2563EB', icon: Bike,    label: 'Dağıtımda' },
  'Müsait':     { bg: '#10B981', text: '#fff', border: '#059669', icon: Users,   label: 'Müsait' },
  'Mola':       { bg: '#F59E0B', text: '#fff', border: '#D97706', icon: Coffee,  label: 'Mola' },
  'Çevrimdışı': { bg: '#9CA3AF', text: '#fff', border: '#6B7280', icon: WifiOff, label: 'Çevrimdışı' },
}

export function createCourierIcon(durum: string, initial: string) {
  const color = DURUM_COLORS[durum]?.bg || '#9CA3AF'
  const border = DURUM_COLORS[durum]?.border || '#6B7280'
  const svg = `
    <svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
      <filter id="shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.25"/>
      </filter>
      <path d="M18 2C10.268 2 4 8.268 4 16c0 10.5 14 26 14 26S32 26.5 32 16c0-7.732-6.268-14-14-14z"
            fill="${color}" stroke="${border}" stroke-width="1.5" filter="url(#shadow)"/>
      <circle cx="18" cy="16" r="10" fill="white" opacity="0.95"/>
      <text x="18" y="20" text-anchor="middle" font-size="10" font-weight="700"
            fill="${color}" font-family="system-ui,sans-serif">${initial}</text>
    </svg>`
  return L.divIcon({
    className: '',
    html: svg,
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -46],
  })
}

const RESTORAN_COLOR = '#F97316'
const RESTORAN_BORDER = '#C2410C'

export function createRestoranIcon() {
  const svg = `
    <svg width="30" height="38" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
      <filter id="shadow2">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.25"/>
      </filter>
      <path d="M18 2C10.268 2 4 8.268 4 16c0 10.5 14 26 14 26S32 26.5 32 16c0-7.732-6.268-14-14-14z"
            fill="${RESTORAN_COLOR}" stroke="${RESTORAN_BORDER}" stroke-width="1.5" filter="url(#shadow2)"/>
      <circle cx="18" cy="16" r="9" fill="white" opacity="0.95"/>
      <path d="M14 12v8M18 12v8M22 12v3a2 2 0 0 1-2 2v3" stroke="${RESTORAN_COLOR}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    </svg>`
  return L.divIcon({
    className: '',
    html: svg,
    iconSize: [30, 38],
    iconAnchor: [15, 38],
    popupAnchor: [0, -40],
  })
}

const KONUM_COLOR = '#8B5CF6'
const KONUM_BORDER = '#6D28D9'

export function createKonumIcon() {
  const svg = `
    <svg width="32" height="40" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
      <filter id="shadow3">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.25"/>
      </filter>
      <path d="M18 2C10.268 2 4 8.268 4 16c0 10.5 14 26 14 26S32 26.5 32 16c0-7.732-6.268-14-14-14z"
            fill="${KONUM_COLOR}" stroke="${KONUM_BORDER}" stroke-width="1.5" filter="url(#shadow3)"/>
      <circle cx="18" cy="16" r="6" fill="white" opacity="0.95"/>
    </svg>`
  return L.divIcon({
    className: '',
    html: svg,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -42],
  })
}

export function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView(points[0], 15)
      return
    }
    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 })
  }, [map, points])
  return null
}
