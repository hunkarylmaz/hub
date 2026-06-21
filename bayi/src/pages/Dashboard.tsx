import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Search, MoreVertical, Eye, Bike, CreditCard, MapPin, Phone, Ban, Store, Loader2, AlertCircle } from 'lucide-react'
import { api, DashboardData, Siparis, Kurye, KuryeKonum, Restoran } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { createCourierIcon, createRestoranIcon, FitBounds } from '../lib/mapUtils'
import { KuryeAtaModal, SiparisDetayModal, SiparisAlanModal } from '../components/SiparisModals'

function durumBadge(durum: Siparis['durum']) {
  const map: Record<string, string> = {
    'Beklemede': 'bg-amber-100 text-amber-700',
    'Atandı': 'bg-blue-100 text-blue-700',
    'Yolda': 'bg-indigo-100 text-indigo-700',
    'Teslim Edildi': 'bg-emerald-100 text-emerald-700',
    'İptal': 'bg-red-100 text-red-600',
  }
  return map[durum] || 'bg-gray-100 text-gray-600'
}

function formatZaman(dt: string) {
  const d = new Date(dt)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

type AlanField = 'musteri_telefon' | 'teslimat_adresi' | 'odeme_yontemi'

function RowActionsMenu({
  siparis, open, onToggle, onClose, onAta, onDetay, onAlan, onIptal,
}: {
  siparis: Siparis
  open: boolean
  onToggle: () => void
  onClose: () => void
  onAta: () => void
  onDetay: () => void
  onAlan: (field: AlanField, title: string) => void
  onIptal: () => void
}) {
  const aktif = siparis.durum !== 'Teslim Edildi' && siparis.durum !== 'İptal'
  return (
    <div className="relative">
      <button onClick={onToggle} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600">
        <MoreVertical size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={onClose} />
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
            <button onClick={() => { onDetay(); onClose() }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
              <Eye size={13} /> Sipariş Detay
            </button>
            {aktif && (
              <button onClick={() => { onAta(); onClose() }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
                <Bike size={13} /> {siparis.kurye_id ? 'Atama Değiştir' : 'Kurye Ata'}
              </button>
            )}
            <button onClick={() => { onAlan('odeme_yontemi', 'Ödeme Güncelleme'); onClose() }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
              <CreditCard size={13} /> Ödeme Güncelleme
            </button>
            <button onClick={() => { onAlan('teslimat_adresi', 'Adres Güncelleme'); onClose() }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
              <MapPin size={13} /> Adres Güncelleme
            </button>
            <button onClick={() => { onAlan('musteri_telefon', 'Telefon Güncelleme'); onClose() }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
              <Phone size={13} /> Telefon Güncelleme
            </button>
            {aktif && (
              <button onClick={() => { onIptal(); onClose() }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 border-t border-gray-50 mt-1">
                <Ban size={13} /> Sipariş İptal
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { bayilik, refreshBayilik } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [kuryeler, setKuryeler] = useState<Kurye[]>([])
  const [konumlar, setKonumlar] = useState<{ kuryeler: KuryeKonum[]; merkez: { lat: number | null; lon: number | null; sehir: string | null; ilce: string | null } }>({ kuryeler: [], merkez: { lat: null, lon: null, sehir: null, ilce: null } })
  const [restoranlar, setRestoranlar] = useState<Restoran[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [durumFilter, setDurumFilter] = useState<'Tümü' | 'Beklemede' | 'Atandı' | 'Yolda'>('Tümü')
  const [delivering, setDelivering] = useState<number | null>(null)
  const [menuFor, setMenuFor] = useState<number | null>(null)
  const [ataModal, setAtaModal] = useState<Siparis | null>(null)
  const [detayModal, setDetayModal] = useState<Siparis | null>(null)
  const [alanModal, setAlanModal] = useState<{ siparis: Siparis; field: AlanField; title: string } | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [dashboard, kList, konumData, rList] = await Promise.all([
        api.dashboard.get(), api.kuryeler.list(), api.kuryeler.konumlar(), api.restoranlar.list(),
      ])
      setData(dashboard)
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
    const id = setInterval(fetchData, 15000)
    return () => clearInterval(id)
  }, [fetchData])

  async function handleTeslim(siparis_id: number) {
    if (!confirm('Teslim edildi olarak işaretlensin mi? 1 kontör düşülecektir.')) return
    setDelivering(siparis_id)
    try {
      await api.siparisler.teslim(siparis_id)
      await fetchData()
      await refreshBayilik()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'İşlem başarısız')
    } finally {
      setDelivering(null)
    }
  }

  async function handleIptal(s: Siparis) {
    if (!confirm('Sipariş iptal edilsin mi?')) return
    try {
      await api.siparisler.setDurum(s.id, 'İptal')
      await fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'İşlem başarısız')
    }
  }

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

  const aktifSiparisler = data?.aktif_siparisler ?? []
  const counts = {
    Tümü: aktifSiparisler.length,
    Beklemede: aktifSiparisler.filter(s => s.durum === 'Beklemede').length,
    Atandı: aktifSiparisler.filter(s => s.durum === 'Atandı').length,
    Yolda: aktifSiparisler.filter(s => s.durum === 'Yolda').length,
  }
  const q = search.trim().toLowerCase()
  const filtered = aktifSiparisler.filter(s => {
    const matchDurum = durumFilter === 'Tümü' || s.durum === durumFilter
    const matchSearch = q === '' || [s.siparis_no, s.musteri_ad, s.kurye_ad, s.restoran_ad, s.teslimat_adresi, s.musteri_telefon]
      .some(v => (v || '').toLowerCase().includes(q))
    return matchDurum && matchSearch
  })

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
      {ataModal && <KuryeAtaModal siparis={ataModal} kuryeler={kuryeler} onClose={() => setAtaModal(null)} onSave={fetchData} />}
      {detayModal && <SiparisDetayModal siparis={detayModal} onClose={() => setDetayModal(null)} />}
      {alanModal && (
        <SiparisAlanModal
          siparis={alanModal.siparis}
          field={alanModal.field}
          title={alanModal.title}
          onClose={() => setAlanModal(null)}
          onSave={fetchData}
        />
      )}

      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-gray-800">Güncel Durum</h1>
        <p className="text-sm text-gray-500 mt-0.5">Bugünkü sipariş ve kurye durumu</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* Header: title, search, filters */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h2 className="text-sm font-semibold text-gray-800">Aktif Siparişler</h2>
            <span className="text-xs text-gray-400">{aktifSiparisler.length} sipariş</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Müşteri, kurye, restoran, adres, telefon..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 w-64"
              />
            </div>
            <div className="flex gap-1">
              {(['Tümü', 'Beklemede', 'Atandı', 'Yolda'] as const).map(d => (
                <button key={d} onClick={() => setDurumFilter(d)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${durumFilter === d ? 'bg-primary-600 text-white' : 'bg-gray-50 border border-gray-200 text-gray-600 hover:border-primary-600'}`}>
                  {d}
                  <span className={`px-1.5 rounded-full text-[10px] ${durumFilter === d ? 'bg-white/20' : 'bg-gray-200 text-gray-500'}`}>{counts[d]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table + real map, side by side */}
        <div className="flex h-[min(640px,calc(100vh-280px))] min-h-[420px]">
          <div className="flex-1 min-w-0 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 z-[1]">
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sipariş</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Müşteri</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Durum</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kurye</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Zaman</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ödeme</th>
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-16 text-sm text-gray-400">Aktif sipariş bulunmuyor</td></tr>
                ) : (
                  filtered.map(s => (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-800">{s.siparis_no}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Store size={11} className="text-gray-400" />{s.restoran_ad || '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-800">{s.musteri_ad || 'Müşteri'}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[170px]">{s.teslimat_adresi || s.musteri_telefon || '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${durumBadge(s.durum)}`}>{s.durum}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{s.kurye_ad || <span className="text-gray-400">Atanmamış</span>}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatZaman(s.olusturma_tarihi)}</td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-sm font-bold text-gray-800">{s.tutar.toFixed(2)} ₺</p>
                        <p className="text-xs text-gray-400">{s.odeme_yontemi}</p>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {s.durum === 'Yolda' && (
                            <button onClick={() => handleTeslim(s.id)} disabled={delivering === s.id}
                              className="text-xs px-2 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-md font-medium disabled:opacity-50 whitespace-nowrap">
                              {delivering === s.id ? '...' : 'Teslim'}
                            </button>
                          )}
                          <RowActionsMenu
                            siparis={s}
                            open={menuFor === s.id}
                            onToggle={() => setMenuFor(menuFor === s.id ? null : s.id)}
                            onClose={() => setMenuFor(null)}
                            onAta={() => setAtaModal(s)}
                            onDetay={() => setDetayModal(s)}
                            onAlan={(field, title) => setAlanModal({ siparis: s, field, title })}
                            onIptal={() => handleIptal(s)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
