import { useState } from 'react'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import { X, Phone, MapPin, Store, User, CreditCard, Bike, Clock, Radio } from 'lucide-react'
import { api, Siparis, Kurye, Restoran, SIPARIS_KANALLARI } from '../lib/api'
import { createKonumIcon } from '../lib/mapUtils'
import KonumSecici from './KonumSecici'

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

const KANAL_STYLE: Record<string, { badge: string; dot: string }> = {
  'Telefon': { badge: 'bg-sky-50 text-sky-700', dot: 'bg-sky-500' },
  'WhatsApp': { badge: 'bg-green-50 text-green-700', dot: 'bg-green-500' },
  'Uygulama': { badge: 'bg-violet-50 text-violet-700', dot: 'bg-violet-500' },
  'Web Sitesi': { badge: 'bg-indigo-50 text-indigo-700', dot: 'bg-indigo-500' },
  'Yemeksepeti': { badge: 'bg-orange-50 text-orange-700', dot: 'bg-orange-500' },
  'Getir Yemek': { badge: 'bg-purple-50 text-purple-700', dot: 'bg-purple-500' },
  'Trendyol Yemek': { badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  'Migros Yemek': { badge: 'bg-teal-50 text-teal-700', dot: 'bg-teal-500' },
}
function kanalStyle(kanal?: string | null) {
  return KANAL_STYLE[kanal || ''] || { badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' }
}

interface YeniSiparisModalProps {
  restoranlar: Restoran[]
  onClose: () => void
  onSave: () => void
}

export function YeniSiparisModal({ restoranlar, onClose, onSave }: YeniSiparisModalProps) {
  const [form, setForm] = useState({ restoran_id: '', musteri_ad: '', musteri_telefon: '', teslimat_adresi: '', tutar: '', odeme_yontemi: 'Nakit', kanal: 'Telefon' })
  const [konum, setKonum] = useState<{ lat: number | null; lon: number | null }>({ lat: null, lon: null })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const secilenRestoran = restoranlar.find(r => String(r.id) === form.restoran_id)
  const konumZorunlu = !!secilenRestoran?.harita_konum
  const haritaMerkezi: [number, number] | undefined = secilenRestoran?.lat != null && secilenRestoran?.lon != null
    ? [secilenRestoran.lat, secilenRestoran.lon]
    : undefined

  async function handleSave() {
    if (!form.restoran_id) { setErr('Restoran seçin'); return }
    if (konumZorunlu && (konum.lat == null || konum.lon == null)) { setErr('Bu restoran için haritadan müşteri konumu seçilmesi zorunlu'); return }
    setSaving(true)
    setErr('')
    try {
      await api.siparisler.create({
        restoran_id: Number(form.restoran_id),
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
            <label className="block text-xs font-medium text-gray-600 mb-1">Restoran *</label>
            <select
              value={form.restoran_id}
              onChange={e => setForm(f => ({ ...f, restoran_id: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
            >
              <option value="">Restoran seçin</option>
              {restoranlar.filter(r => r.aktif).map(r => <option key={r.id} value={r.id}>{r.ad}</option>)}
            </select>
          </div>
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
              center={haritaMerkezi}
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

interface KuryeAtaModalProps {
  siparis: Siparis
  kuryeler: Kurye[]
  onClose: () => void
  onSave: () => void
}

export function KuryeAtaModal({ siparis, kuryeler, onClose, onSave }: KuryeAtaModalProps) {
  const [kurye_id, setKuryeId] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function handleSave() {
    if (!kurye_id) { setErr('Kurye seçin'); return }
    setSaving(true)
    try {
      await api.siparisler.kurye_ata(siparis.id, Number(kurye_id))
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">{siparis.kurye_id ? 'Atama Değiştir' : 'Kurye Ata'} — {siparis.siparis_no}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
          {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
          <div className="space-y-2">
            {kuryeler.filter(k => k.aktif && k.durum !== 'Çevrimdışı').map(k => (
              <label key={k.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${kurye_id === String(k.id) ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" name="kurye" value={k.id} checked={kurye_id === String(k.id)} onChange={() => setKuryeId(String(k.id))} className="sr-only" />
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xs font-bold">
                  {k.ad.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{k.ad}</p>
                  <p className="text-xs text-gray-400">{k.durum} · {k.gunluk_teslimat} teslimat</p>
                </div>
                {k.durum === 'Müsait' && <span className="text-xs text-emerald-600 font-medium">Müsait</span>}
              </label>
            ))}
            {kuryeler.filter(k => k.aktif && k.durum !== 'Çevrimdışı').length === 0 && (
              <p className="text-center text-sm text-gray-400 py-6">Uygun kurye bulunamadı</p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">İptal</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60">
            {saving ? '...' : 'Ata'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function SiparisDetayModal({ siparis, onClose }: { siparis: Siparis; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-800">Sipariş Detayı</h3>
            <p className="text-xs text-gray-400 font-mono">{siparis.siparis_no}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${durumBadge(siparis.durum)}`}>{siparis.durum}</span>
            <span className="text-lg font-bold text-gray-800">{siparis.tutar.toFixed(2)} ₺</span>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Store size={15} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-800 font-medium">{siparis.restoran_ad || '—'}</p>
                <p className="text-xs text-gray-400">Restoran</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Radio size={15} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${kanalStyle(siparis.kanal).badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${kanalStyle(siparis.kanal).dot}`} />
                  {siparis.kanal || 'Telefon'}
                </span>
                <p className="text-xs text-gray-400 mt-1">Sipariş Kanalı</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User size={15} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-800 font-medium">{siparis.musteri_ad || 'Müşteri'}</p>
                <p className="text-xs text-gray-400">Müşteri</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone size={15} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-800 font-medium">{siparis.musteri_telefon || '—'}</p>
                <p className="text-xs text-gray-400">Müşteri Telefon</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={15} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-800 font-medium">{siparis.teslimat_adresi || '—'}</p>
                <p className="text-xs text-gray-400">Teslimat Adresi</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Bike size={15} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-800 font-medium">{siparis.kurye_ad || 'Atanmamış'}</p>
                <p className="text-xs text-gray-400">Kurye{siparis.kurye_telefon ? ` · ${siparis.kurye_telefon}` : ''}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CreditCard size={15} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-800 font-medium">{siparis.odeme_yontemi}</p>
                <p className="text-xs text-gray-400">Ödeme Yöntemi</p>
              </div>
            </div>
            {siparis.musteri_lat != null && siparis.musteri_lon != null && (
              <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height: 160 }}>
                <MapContainer center={[siparis.musteri_lat, siparis.musteri_lon]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
                  <Marker position={[siparis.musteri_lat, siparis.musteri_lon]} icon={createKonumIcon()} />
                </MapContainer>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Clock size={15} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-800 font-medium">{formatTarih(siparis.olusturma_tarihi)}</p>
                <p className="text-xs text-gray-400">
                  Oluşturma{siparis.atama_zamani ? ` · Atama: ${formatTarih(siparis.atama_zamani)}` : ''}{siparis.teslim_zamani ? ` · Teslim: ${formatTarih(siparis.teslim_zamani)}` : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Kapat</button>
        </div>
      </div>
    </div>
  )
}

type DuzenleField = 'musteri_telefon' | 'teslimat_adresi' | 'kanal'

interface SiparisAlanModalProps {
  siparis: Siparis
  field: DuzenleField
  title: string
  onClose: () => void
  onSave: () => void
}

const ODEME_SECENEKLERI = ['Nakit', 'Kredi Kartı', 'Yemek Kartı', 'Online']

export function SiparisAlanModal({ siparis, field, title, onClose, onSave }: SiparisAlanModalProps) {
  const [value, setValue] = useState<string>(String(siparis[field] ?? ''))
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function handleSave() {
    setSaving(true)
    setErr('')
    try {
      await api.siparisler.duzenle(siparis.id, { [field]: value })
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">{title} — {siparis.siparis_no}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-3">
          {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
          {field === 'kanal' ? (
            <select
              value={value}
              onChange={e => setValue(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
              autoFocus
            >
              {SIPARIS_KANALLARI.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          ) : (
            <input
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={field === 'musteri_telefon' ? 'Telefon numarası' : 'Teslimat adresi'}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
              autoFocus
            />
          )}
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">İptal</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60">
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function OdemeDuzenleModal({ siparis, onClose, onSave }: { siparis: Siparis; onClose: () => void; onSave: () => void }) {
  const [tutar, setTutar] = useState(String(siparis.tutar ?? ''))
  const [odemeYontemi, setOdemeYontemi] = useState(siparis.odeme_yontemi)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function handleSave() {
    const n = Number(tutar)
    if (!tutar || Number.isNaN(n) || n < 0) { setErr('Geçerli bir tutar girin'); return }
    setSaving(true)
    setErr('')
    try {
      await api.siparisler.duzenle(siparis.id, { tutar: n, odeme_yontemi: odemeYontemi })
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Ödeme Düzenleme — {siparis.siparis_no}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tutar (₺)</label>
            <input
              type="number" min="0" step="0.01" autoFocus
              value={tutar}
              onChange={e => setTutar(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ödeme Yöntemi</label>
            <select
              value={odemeYontemi}
              onChange={e => setOdemeYontemi(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
            >
              {ODEME_SECENEKLERI.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">İptal</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60">
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}
