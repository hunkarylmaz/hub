import { useState } from 'react'
import { X, Phone, MapPin, Store, User, CreditCard, Bike, Clock } from 'lucide-react'
import { api, Siparis, Kurye } from '../lib/api'

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
                <p className="text-xs text-gray-400">Telefon</p>
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
                <p className="text-xs text-gray-400">Kurye</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CreditCard size={15} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-800 font-medium">{siparis.odeme_yontemi}</p>
                <p className="text-xs text-gray-400">Ödeme Yöntemi</p>
              </div>
            </div>
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

type DuzenleField = 'musteri_telefon' | 'teslimat_adresi' | 'odeme_yontemi'

interface SiparisAlanModalProps {
  siparis: Siparis
  field: DuzenleField
  title: string
  onClose: () => void
  onSave: () => void
}

const ODEME_SECENEKLERI = ['Nakit', 'Kart', 'Online']

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
          {field === 'odeme_yontemi' ? (
            <select
              value={value}
              onChange={e => setValue(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
              autoFocus
            >
              {ODEME_SECENEKLERI.map(o => <option key={o} value={o}>{o}</option>)}
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
