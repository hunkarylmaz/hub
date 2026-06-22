import { useState, useEffect, useCallback } from 'react'
import { LogOut, Plus, X, Store, Loader2 } from 'lucide-react'
import { api, Siparis, SIPARIS_KANALLARI } from '../lib/api'
import { useRestoranAuth } from '../contexts/RestoranAuthContext'
import KonumSecici from '../components/KonumSecici'

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

function formatTarih(dt: string | null) {
  if (!dt) return '—'
  const d = new Date(dt)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const ODEME_YONTEMLERI = ['Nakit', 'Kredi Kartı', 'Yemek Kartı', 'Online']

function YeniSiparisModalRestoran({ konumZorunlu, onClose, onSave }: { konumZorunlu: boolean; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ musteri_ad: '', musteri_telefon: '', teslimat_adresi: '', tutar: '', odeme_yontemi: 'Nakit', kanal: 'Telefon' })
  const [konum, setKonum] = useState<{ lat: number | null; lon: number | null }>({ lat: null, lon: null })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function handleSave() {
    if (konumZorunlu && (konum.lat == null || konum.lon == null)) { setErr('Müşteri konumunun haritadan seçilmesi zorunlu'); return }
    setSaving(true)
    setErr('')
    try {
      await api.restoranPortal.siparisler.create({
        musteri_ad: form.musteri_ad || undefined,
        musteri_telefon: form.musteri_telefon || undefined,
        teslimat_adresi: form.teslimat_adresi || undefined,
        musteri_lat: konum.lat ?? undefined,
        musteri_lon: konum.lon ?? undefined,
        tutar: form.tutar ? Number(form.tutar) : undefined,
        odeme_yontemi: form.odeme_yontemi,
        kanal: form.kanal,
      })
      onSave()
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Hata')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="font-semibold text-gray-800">Yeni Sipariş</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sipariş Kanalı *</label>
            <select
              value={form.kanal}
              onChange={e => setForm(f => ({ ...f, kanal: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
            >
              {SIPARIS_KANALLARI.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Müşteri Adı</label>
              <input value={form.musteri_ad} onChange={e => setForm(f => ({ ...f, musteri_ad: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telefon</label>
              <input value={form.musteri_telefon} onChange={e => setForm(f => ({ ...f, musteri_telefon: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Teslimat Adresi</label>
            <input value={form.teslimat_adresi} onChange={e => setForm(f => ({ ...f, teslimat_adresi: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Müşteri Konumu {konumZorunlu && <span className="text-red-500">*</span>}
              {!konumZorunlu && <span className="text-gray-400 font-normal"> (opsiyonel)</span>}
            </label>
            <KonumSecici
              lat={konum.lat}
              lon={konum.lon}
              onChange={(lat, lon) => setKonum({ lat, lon })}
              onAdresBulundu={s => setForm(f => ({ ...f, teslimat_adresi: s.display_name }))}
              searchFn={api.restoranPortal.geocode.ara}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tutar (₺)</label>
              <input type="number" value={form.tutar} onChange={e => setForm(f => ({ ...f, tutar: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ödeme Yöntemi</label>
              <select value={form.odeme_yontemi} onChange={e => setForm(f => ({ ...f, odeme_yontemi: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20">
                {ODEME_YONTEMLERI.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">İptal</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60">
            {saving ? 'Kaydediliyor...' : 'Sipariş Oluştur'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RestoranPortal() {
  const { restoran, logout } = useRestoranAuth()
  const [siparisler, setSiparisler] = useState<Siparis[]>([])
  const [loading, setLoading] = useState(true)
  const [showYeni, setShowYeni] = useState(false)

  const fetchSiparisler = useCallback(async () => {
    try {
      const data = await api.restoranPortal.siparisler.list()
      setSiparisler(data)
    } catch {} finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSiparisler()
    const id = setInterval(fetchSiparisler, 5000)
    return () => clearInterval(id)
  }, [fetchSiparisler])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white shrink-0">
            <Store size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 leading-tight">{restoran?.ad}</p>
            <p className="text-xs text-gray-400 leading-tight">Restoran Sipariş Paneli</p>
          </div>
        </div>
        <button onClick={logout} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors">
          <LogOut size={15} /> Çıkış
        </button>
      </header>

      <main className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Siparişlerim</h1>
            <p className="text-sm text-gray-500 mt-0.5">Girdiğiniz siparişler bayi paneline anında iletilir</p>
          </div>
          <button onClick={() => setShowYeni(true)} className="btn-primary px-4 py-2.5 text-sm flex items-center gap-1.5">
            <Plus size={15} /> Yeni Sipariş
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-primary-600" />
            </div>
          ) : siparisler.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">Henüz sipariş girilmedi</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400">
                  <th className="text-left font-medium px-4 py-3">Sipariş</th>
                  <th className="text-left font-medium px-4 py-3">Müşteri</th>
                  <th className="text-left font-medium px-4 py-3">Kurye</th>
                  <th className="text-left font-medium px-4 py-3">Tutar</th>
                  <th className="text-left font-medium px-4 py-3">Durum</th>
                  <th className="text-left font-medium px-4 py-3">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {siparisler.map(s => (
                  <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{s.siparis_no}</p>
                      <p className="text-xs text-gray-400">{s.kanal}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{s.musteri_ad || '—'}</p>
                      <p className="text-xs text-gray-400">{s.musteri_telefon || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{s.kurye_ad || 'Atanmamış'}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">₺{s.tutar.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${durumBadge(s.durum)}`}>{s.durum}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatTarih(s.olusturma_tarihi)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {showYeni && (
        <YeniSiparisModalRestoran
          konumZorunlu={!!restoran?.harita_konum}
          onClose={() => setShowYeni(false)}
          onSave={fetchSiparisler}
        />
      )}
    </div>
  )
}
