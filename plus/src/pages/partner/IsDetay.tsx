import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, User, Package, Clock, Truck, ChevronLeft, Copy, Check, Loader2, XCircle } from 'lucide-react'
import { api, Is } from '../../lib/api'

const DURUM_STEPS = ['Havuzda', 'Alındı', 'Yolda', 'Teslim Edildi']

const DURUM_CONFIG: Record<string, { color: string; bg: string; dot: string }> = {
  'Havuzda':       { color: 'text-sky-700',     bg: 'bg-sky-50',     dot: 'bg-sky-400' },
  'Alındı':        { color: 'text-amber-700',    bg: 'bg-amber-50',   dot: 'bg-amber-400' },
  'Yolda':         { color: 'text-blue-700',     bg: 'bg-blue-50',    dot: 'bg-blue-500' },
  'Teslim Edildi': { color: 'text-emerald-700',  bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  'İptal':         { color: 'text-red-700',      bg: 'bg-red-50',     dot: 'bg-red-400' },
}

export default function IsDetay() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [is, setIs] = useState<Is | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    api.partner.isDetay(Number(id)).then(setIs).finally(() => setLoading(false))
  }, [id])

  async function handleIptal() {
    if (!is || !confirm('Bu işi iptal etmek istediğinizden emin misiniz?')) return
    setCancelling(true)
    try {
      await api.partner.isIptal(is.id)
      const updated = await api.partner.isDetay(is.id)
      setIs(updated)
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setCancelling(false)
    }
  }

  function copyQr() {
    if (!is) return
    navigator.clipboard.writeText(is.qr_kodu)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={24} className="animate-spin text-primary-600" />
    </div>
  )

  if (!is) return (
    <div className="text-center py-16">
      <p className="text-gray-500">İş bulunamadı.</p>
      <button onClick={() => navigate(-1)} className="btn-secondary mt-4">Geri Dön</button>
    </div>
  )

  const cfg = DURUM_CONFIG[is.durum] || DURUM_CONFIG['Havuzda']
  const stepIdx = DURUM_STEPS.indexOf(is.durum)

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Back + header */}
      <div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ChevronLeft size={16} /> Geri
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">İş #{String(is.id).padStart(4,'0')}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {new Date(is.olusturma).toLocaleString('tr-TR', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${cfg.bg}`}>
            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            <span className={`text-sm font-semibold ${cfg.color}`}>{is.durum}</span>
          </div>
        </div>
      </div>

      {/* Progress bar — only if not cancelled */}
      {is.durum !== 'İptal' && (
        <div className="card p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Taşıma Durumu</p>
          <div className="flex items-center">
            {DURUM_STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i < stepIdx ? 'bg-primary-600 text-white' :
                    i === stepIdx ? 'bg-primary-600 text-white ring-4 ring-primary-100' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {i < stepIdx ? <Check size={14} /> : i + 1}
                  </div>
                  <p className={`text-xs mt-1.5 hidden sm:block font-medium ${i <= stepIdx ? 'text-primary-600' : 'text-gray-400'}`}>
                    {s}
                  </p>
                </div>
                {i < DURUM_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${i < stepIdx ? 'bg-primary-600' : 'bg-gray-100'}`} />
                )}
              </div>
            ))}
          </div>
          {is.tasiyici_ad && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
              <Truck size={14} className="text-gray-400" />
              <span className="text-sm text-gray-600">Taşıyıcı: <span className="font-semibold text-gray-800">{is.tasiyici_ad}</span></span>
            </div>
          )}
        </div>
      )}

      {/* QR Code */}
      <div className="card p-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">QR Kodu</p>
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center shrink-0">
            <Package size={28} className="text-gray-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-2">Bu kodu taşıyıcı ile paylaşın</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-sm font-mono text-gray-600 truncate border border-gray-100">
                {is.qr_kodu}
              </code>
              <button onClick={copyQr}
                className={`p-2 rounded-xl border transition-all shrink-0 ${
                  copied ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-gray-200 hover:bg-gray-50 text-gray-500'
                }`}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Locations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center">
              <MapPin size={14} className="text-primary-600" />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Alış Noktası</p>
          </div>
          <p className="text-sm font-bold text-gray-800">{is.alis_il} / {is.alis_ilce}</p>
          {is.alis_mahalle && <p className="text-xs text-gray-500 mt-0.5">{is.alis_mahalle}</p>}
          <p className="text-xs text-gray-500 mt-1">{is.alis_adres}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <MapPin size={14} className="text-emerald-600" />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Bırakılma Noktası</p>
          </div>
          <p className="text-sm font-bold text-gray-800">{is.birakilis_il} / {is.birakilis_ilce}</p>
          {is.birakilis_mahalle && <p className="text-xs text-gray-500 mt-0.5">{is.birakilis_mahalle}</p>}
          <p className="text-xs text-gray-500 mt-1">{is.birakilis_adres}</p>
        </div>
      </div>

      {/* People */}
      <div className="card p-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Kişi Bilgileri</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <User size={14} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500">Gönderici</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">{is.gonderici_ad}</p>
              <p className="text-xs text-gray-400">{is.gonderici_telefon}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
              <User size={14} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500">Alıcı</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">{is.alici_ad}</p>
              <p className="text-xs text-gray-400">{is.alici_telefon}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Package info */}
      <div className="card p-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Paket Bilgileri</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Package size={20} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Boyut</p>
              <p className="text-sm font-bold text-gray-800">{is.paket_boyutu}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Alınma Saati</p>
              <p className="text-sm font-bold text-gray-800">
                {new Date(is.alinma_saati).toLocaleString('tr-TR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
              </p>
            </div>
          </div>
        </div>
        {is.aciklama && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Not</p>
            <p className="text-sm text-gray-600">{is.aciklama}</p>
          </div>
        )}
      </div>

      {/* Cancel button */}
      {is.durum === 'Havuzda' && (
        <button onClick={handleIptal} disabled={cancelling}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors">
          {cancelling ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
          {cancelling ? 'İptal ediliyor...' : 'İşi İptal Et'}
        </button>
      )}
    </div>
  )
}
