import { useState, useEffect, useCallback } from 'react'
import { Package, CheckCircle, Clock, MapPin, Phone, Loader2, AlertCircle, Zap, Users } from 'lucide-react'
import { api, DashboardData, Siparis, Kurye } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

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

function kuryeDurumColor(durum: Kurye['durum']) {
  const map: Record<string, string> = {
    'Müsait': 'bg-emerald-500',
    'Dağıtımda': 'bg-blue-500',
    'Mola': 'bg-amber-500',
    'Çevrimdışı': 'bg-gray-400',
  }
  return map[durum] || 'bg-gray-400'
}

function formatSaat(dt: string) {
  const d = new Date(dt)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

export default function Dashboard() {
  const { bayilik, refreshBayilik } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [kuryeler, setKuryeler] = useState<Kurye[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [assigning, setAssigning] = useState<number | null>(null)
  const [delivering, setDelivering] = useState<number | null>(null)
  const [kurye_tab, setKuryeTab] = useState<'tumu' | 'dagitimda'>('tumu')

  const fetchData = useCallback(async () => {
    try {
      const [dashboard, kList] = await Promise.all([api.dashboard.get(), api.kuryeler.list()])
      setData(dashboard)
      setKuryeler(kList)
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

  async function handleOtoAta(siparis_id: number) {
    setAssigning(siparis_id)
    try {
      await api.siparisler.oto_ata(siparis_id)
      await fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Atama başarısız')
    } finally {
      setAssigning(null)
    }
  }

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

  const filteredKuryeler = kurye_tab === 'dagitimda'
    ? kuryeler.filter(k => k.durum === 'Dağıtımda')
    : kuryeler.filter(k => k.aktif === 1)

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-gray-800">Güncel Durum</h1>
        <p className="text-sm text-gray-500 mt-0.5">Bugünkü sipariş ve kurye durumu</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <StatCard icon={<Package size={18} className="text-blue-600" />} label="Toplam Sipariş" value={data?.siparis_toplam ?? 0} color="blue" />
        <StatCard icon={<Clock size={18} className="text-amber-500" />} label="Bekleyen" value={data?.siparis_bekleyen ?? 0} color="amber" />
        <StatCard icon={<Zap size={18} className="text-indigo-500" />} label="Yolda" value={data?.siparis_yolda ?? 0} color="indigo" />
        <StatCard icon={<CheckCircle size={18} className="text-emerald-600" />} label="Teslim Edildi" value={data?.siparis_teslim ?? 0} color="emerald" />
        <StatCard icon={<Users size={18} className="text-primary-600" />} label="Aktif Kurye" value={data?.kurye_dagitimda ?? 0} color="primary" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Active Orders */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">Aktif Siparişler</h2>
            <span className="text-xs text-gray-400">{data?.aktif_siparisler.length || 0} sipariş</span>
          </div>

          {/* Map placeholder */}
          <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="absolute border border-gray-400" style={{
                  left: `${(i % 3) * 33}%`, top: `${Math.floor(i / 3) * 50}%`,
                  width: '33%', height: '50%'
                }} />
              ))}
            </div>
            {data?.aktif_siparisler.map((s, i) => (
              <div key={s.id} className="absolute" style={{
                left: `${15 + (i * 13) % 70}%`,
                top: `${20 + (i * 17) % 60}%`,
              }}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md ${
                  s.durum === 'Yolda' ? 'bg-indigo-500' : s.durum === 'Atandı' ? 'bg-blue-500' : 'bg-amber-500'
                }`}>
                  <MapPin size={10} />
                </div>
              </div>
            ))}
            <div className="absolute bottom-2 left-2 bg-white/80 backdrop-blur rounded-lg px-2 py-1 text-xs text-gray-600">
              {bayilik?.sehir || 'İzmir'} Teslimat Haritası
            </div>
          </div>

          {/* Order list */}
          <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
            {data?.aktif_siparisler.length === 0 ? (
              <p className="text-center py-8 text-sm text-gray-400">Aktif sipariş bulunmuyor</p>
            ) : (
              data?.aktif_siparisler.map(s => (
                <div key={s.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${durumBadge(s.durum)}`}>{s.durum}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{s.siparis_no}</p>
                      <p className="text-xs text-gray-400">{s.restoran_ad} · {s.musteri_ad || 'Müşteri'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800">{s.tutar.toFixed(2)} ₺</p>
                      <p className="text-xs text-gray-400">{s.kurye_ad || '—'} · {formatSaat(s.olusturma_tarihi)}</p>
                    </div>
                    <div className="flex gap-1">
                      {!s.kurye_id && (
                        <button
                          onClick={() => handleOtoAta(s.id)}
                          disabled={assigning === s.id}
                          className="text-xs px-2 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                        >
                          {assigning === s.id ? '...' : 'Ata'}
                        </button>
                      )}
                      {s.durum !== 'Teslim Edildi' && s.kurye_id && (
                        <button
                          onClick={() => handleTeslim(s.id)}
                          disabled={delivering === s.id}
                          className="text-xs px-2 py-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {delivering === s.id ? '...' : 'Teslim'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Courier Panel */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Kurye Durumu</h2>
            <div className="flex gap-1 mt-2">
              <button
                onClick={() => setKuryeTab('tumu')}
                className={`text-xs px-3 py-1 rounded-full ${kurye_tab === 'tumu' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Tümü
              </button>
              <button
                onClick={() => setKuryeTab('dagitimda')}
                className={`text-xs px-3 py-1 rounded-full ${kurye_tab === 'dagitimda' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Dağıtımda
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {filteredKuryeler.length === 0 ? (
              <p className="text-center py-8 text-sm text-gray-400">Kurye bulunamadı</p>
            ) : (
              filteredKuryeler.map(k => (
                <div key={k.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm">
                      {k.ad.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${kuryeDurumColor(k.durum)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{k.ad}</p>
                    <p className="text-xs text-gray-400">{k.durum} · {k.gunluk_teslimat} teslimat</p>
                  </div>
                  {k.telefon && (
                    <a href={`tel:${k.telefon}`} className="text-gray-400 hover:text-primary-600">
                      <Phone size={14} />
                    </a>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-emerald-600">{data?.kurye_musait ?? 0}</p>
              <p className="text-xs text-gray-400">Müsait</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-600">{data?.kurye_dagitimda ?? 0}</p>
              <p className="text-xs text-gray-400">Dağıtımda</p>
            </div>
            <div>
              <p className="text-lg font-bold text-amber-500">{data?.kurye_mola ?? 0}</p>
              <p className="text-xs text-gray-400">Mola</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200',
    amber: 'bg-amber-50 border-amber-200',
    indigo: 'bg-indigo-50 border-indigo-200',
    emerald: 'bg-emerald-50 border-emerald-200',
    primary: 'bg-primary-50 border-primary-100',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs font-medium text-gray-600">{label}</span></div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  )
}
