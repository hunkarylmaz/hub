import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Loader2, AlertCircle } from 'lucide-react'
import { api, Siparis, Kurye, KuryeKonum, Restoran } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { createCourierIcon, createRestoranIcon, FitBounds } from '../lib/mapUtils'
import SiparisTablosu from '../components/SiparisTablosu'

export default function Dashboard() {
  const { bayilik } = useAuth()
  const [siparisler, setSiparisler] = useState<Siparis[]>([])
  const [kuryeler, setKuryeler] = useState<Kurye[]>([])
  const [konumlar, setKonumlar] = useState<{ kuryeler: KuryeKonum[]; merkez: { lat: number | null; lon: number | null; sehir: string | null; ilce: string | null } }>({ kuryeler: [], merkez: { lat: null, lon: null, sehir: null, ilce: null } })
  const [restoranlar, setRestoranlar] = useState<Restoran[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [sList, kList, konumData, rList] = await Promise.all([
        api.siparisler.list(), api.kuryeler.list(), api.kuryeler.konumlar(), api.restoranlar.list(),
      ])
      setSiparisler(sList)
      setKuryeler(kList)
      setKonumlar(konumData)
      setRestoranlar(rList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veri yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 3000)
    return () => clearInterval(id)
  }, [fetchData])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={32} className="animate-spin text-primary-600" />
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <AlertCircle size={32} className="text-red-500" />
      <p className="text-gray-600">{error}</p>
      <button onClick={fetchData} className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg">Tekrar Dene</button>
    </div>
  )

  const restoranNoktalari = restoranlar.filter((r): r is Restoran & { lat: number; lon: number } => r.lat != null && r.lon != null)

  // Center priority: 1) bayilik registered location 2) average of courier positions 3) Turkey center
  const merkez = konumlar.merkez
  const mapCenter: [number, number] = (() => {
    if (merkez.lat && merkez.lon) return [merkez.lat, merkez.lon]
    if (konumlar.kuryeler.length > 0) return [
      konumlar.kuryeler.reduce((a, k) => a + k.lat, 0) / konumlar.kuryeler.length,
      konumlar.kuryeler.reduce((a, k) => a + k.lon, 0) / konumlar.kuryeler.length,
    ]
    return [39.9334, 32.8597] // Turkey center
  })()
  const mapPoints: [number, number][] = [
    ...konumlar.kuryeler.map(k => [k.lat, k.lon] as [number, number]),
    ...restoranNoktalari.map(r => [r.lat, r.lon] as [number, number]),
  ]

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-gray-800">Güncel Durum</h1>
        <p className="text-sm text-gray-500 mt-0.5">Bugünkü sipariş ve kurye durumu</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex h-[min(680px,calc(100vh-260px))] min-h-[460px]">
          <div className="flex-1 min-w-0 min-h-0">
            <SiparisTablosu
              siparisler={siparisler}
              kuryeler={kuryeler}
              restoranlar={restoranlar}
              onRefresh={fetchData}
              title="Aktif Siparişler"
              bare
            />
          </div>

          {/* Live map */}
          <div className="w-[420px] shrink-0 relative border-l border-gray-100">
            <MapContainer
              center={mapCenter}
              zoom={mapPoints.length > 0 ? 13 : 11}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> katkıda bulunanlar'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
              {mapPoints.length > 0 && <FitBounds points={mapPoints} />}
              {konumlar.kuryeler.map(k => {
                const initials = k.ad.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                return (
                  <Marker key={`k-${k.id}`} position={[k.lat, k.lon]} icon={createCourierIcon(k.durum, initials)}>
                    <Popup minWidth={160}>
                      <div className="text-xs">
                        <p className="font-semibold text-gray-900">{k.ad}</p>
                        <p className="text-gray-500">{k.durum} · {k.gunluk_teslimat} teslimat</p>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
              {restoranNoktalari.map(r => (
                <Marker key={`r-${r.id}`} position={[r.lat, r.lon]} icon={createRestoranIcon()}>
                  <Popup minWidth={160}>
                    <div className="text-xs">
                      <p className="font-semibold text-gray-900">{r.ad}</p>
                      <p className="text-gray-500">{r.adres || 'Adres bilgisi yok'}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm pointer-events-none z-[1000]">
              {merkez.ilce || merkez.sehir || bayilik?.sehir || 'Türkiye'} Teslimat Haritası
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
