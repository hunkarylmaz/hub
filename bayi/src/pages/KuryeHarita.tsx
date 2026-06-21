import { useRef, useState, useCallback, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Loader2, Navigation, RefreshCw, Clock } from 'lucide-react'
import { api, KuryeKonum } from '../lib/api'
import { DURUM_COLORS, createCourierIcon, FitBounds } from '../lib/mapUtils'

function formatSure(dt: string | null) {
  if (!dt) return 'Bilinmiyor'
  const diff = (Date.now() - new Date(dt).getTime()) / 1000
  if (diff < 60) return `${Math.floor(diff)} sn önce`
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`
  return `${Math.floor(diff / 3600)} saat önce`
}

export default function KuryeHarita() {
  const [kuryeler, setKuryeler] = useState<KuryeKonum[]>([])
  const [merkez, setMerkez] = useState<{ lat: number | null; lon: number | null; sehir: string | null; ilce: string | null }>({ lat: null, lon: null, sehir: null, ilce: null })
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [filter, setFilter] = useState<string>('Tümü')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchKonumlar = useCallback(async () => {
    try {
      const data = await api.kuryeler.konumlar()
      setKuryeler(data.kuryeler)
      setMerkez(data.merkez)
      setLastUpdate(new Date())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchKonumlar()
  }, [fetchKonumlar])

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchKonumlar, 30000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [autoRefresh, fetchKonumlar])

  const filtered = filter === 'Tümü' ? kuryeler : kuryeler.filter(k => k.durum === filter)
  const durumSayilari = Object.fromEntries(
    ['Dağıtımda', 'Müsait', 'Mola', 'Çevrimdışı'].map(d => [d, kuryeler.filter(k => k.durum === d).length])
  )

  // Center priority: 1) bayilik registered location 2) average of couriers 3) Turkey center
  const mapCenter: [number, number] = (() => {
    if (merkez.lat && merkez.lon) return [merkez.lat, merkez.lon]
    if (kuryeler.length > 0) return [
      kuryeler.reduce((a, k) => a + k.lat, 0) / kuryeler.length,
      kuryeler.reduce((a, k) => a + k.lon, 0) / kuryeler.length,
    ]
    return [39.9334, 32.8597] // Turkey center
  })()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Kurye Haritası</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {merkez.ilce || merkez.sehir ? `${merkez.ilce || merkez.sehir} bölgesi · ` : ''}Kuryelerin anlık konumları{lastUpdate ? ` · Son güncelleme: ${lastUpdate.toLocaleTimeString('tr-TR')}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(a => !a)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-colors ${autoRefresh ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-gray-500 border-gray-200'}`}>
            <Clock size={13} /> {autoRefresh ? 'Otomatik (30s)' : 'Durduruldu'}
          </button>
          <button onClick={fetchKonumlar}
            className="flex items-center gap-1.5 px-3 py-2 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <RefreshCw size={13} /> Yenile
          </button>
        </div>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        {[
          { label: 'Tümü', value: kuryeler.length, color: 'bg-gray-50 border-gray-200 text-gray-700' },
          { label: 'Dağıtımda', value: durumSayilari['Dağıtımda'], color: 'bg-blue-50 border-blue-200 text-blue-700' },
          { label: 'Müsait', value: durumSayilari['Müsait'], color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
          { label: 'Mola', value: durumSayilari['Mola'], color: 'bg-amber-50 border-amber-200 text-amber-700' },
          { label: 'Çevrimdışı', value: durumSayilari['Çevrimdışı'], color: 'bg-gray-50 border-gray-200 text-gray-500' },
        ].map(({ label, value, color }) => (
          <button key={label} onClick={() => setFilter(label)}
            className={`rounded-xl border p-3 text-left transition-all ${color} ${filter === label ? 'ring-2 ring-primary-500 ring-offset-1' : 'hover:opacity-80'}`}>
            <p className="text-xs font-medium opacity-70">{label}</p>
            <p className="text-xl font-bold mt-0.5">{value ?? 0}</p>
          </button>
        ))}
      </div>

      {/* Map container */}
      <div className="flex-1 rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ minHeight: 500 }}>
        {loading ? (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center">
              <Loader2 size={32} className="animate-spin text-primary-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Harita yükleniyor...</p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            {/* OpenStreetMap tiles */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> katkıda bulunanlar'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />

            {filtered.length > 0 && <FitBounds points={filtered.map(k => [k.lat, k.lon])} />}

            {filtered.map(k => {
              const initials = k.ad.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              const icon = createCourierIcon(k.durum, initials)
              const c = DURUM_COLORS[k.durum] || DURUM_COLORS['Çevrimdışı']
              const StatusIcon = c.icon
              return (
                <Marker key={k.id} position={[k.lat, k.lon]} icon={icon}>
                  <Popup minWidth={220}>
                    <div className="font-sans p-0">
                      {/* Header */}
                      <div className="px-4 py-3 border-b" style={{ backgroundColor: c.bg + '18' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                               style={{ backgroundColor: c.bg }}>
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{k.ad}</p>
                            {k.telefon && <p className="text-xs text-gray-500">{k.telefon}</p>}
                          </div>
                        </div>
                      </div>
                      {/* Body */}
                      <div className="px-4 py-3 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Durum</span>
                          <span className="flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: c.bg + '20', color: c.bg }}>
                            <StatusIcon size={10} />
                            {k.durum}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Bugün</span>
                          <span className="font-semibold text-gray-700">{k.gunluk_teslimat} teslimat</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Toplam</span>
                          <span className="font-semibold text-gray-700">{k.toplam_teslimat} teslimat</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t">
                          <span className="text-gray-400 flex items-center gap-1">
                            <Navigation size={10} /> Konum
                          </span>
                          <span className="text-gray-400">{formatSure(k.son_konum_tarihi)}</span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>
        )}
      </div>

      {/* Courier list below map */}
      {!loading && (
        <div className="mt-4 bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Kurye Listesi</h3>
            <span className="text-xs text-gray-400">{filtered.length} kurye konumu</span>
          </div>
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">Konumu olan kurye bulunamadı</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map(k => {
                const c = DURUM_COLORS[k.durum] || DURUM_COLORS['Çevrimdışı']
                const StatusIcon = c.icon
                return (
                  <div key={k.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50/50">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                         style={{ backgroundColor: c.bg }}>
                      {k.ad.split(' ').map(n => n[0]).join('').slice(0,2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{k.ad}</p>
                      <p className="text-xs text-gray-400">{k.telefon || '—'}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-gray-500">{k.gunluk_teslimat} bugün</span>
                      <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: c.bg + '18', color: c.bg }}>
                        <StatusIcon size={10} />
                        {k.durum}
                      </span>
                      <span className="text-xs text-gray-400">{formatSure(k.son_konum_tarihi)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
