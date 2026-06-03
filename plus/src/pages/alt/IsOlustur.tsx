import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package, MapPin, Building2, Check, ChevronRight, ChevronLeft,
  Loader2, CheckCircle2,
} from 'lucide-react'
import { api, PaketBoyutu } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

/* ── Package size options ── */
const PAKET_TIPLERI: { value: PaketBoyutu; label: string; desc: string }[] = [
  { value: 'Zarf',  label: 'Zarf',  desc: 'A4 zarf, belge'     },
  { value: 'Küçük', label: 'Küçük', desc: 'Ayakkabı kutusu'    },
  { value: 'Orta',  label: 'Orta',  desc: 'Orta boy kutu'      },
  { value: 'Büyük', label: 'Büyük', desc: 'Büyük karton kutu'  },
  { value: 'Koli',  label: 'Koli',  desc: 'Kargo kolisi'       },
]

const STEPS = ['Paket Bilgileri', 'Özet']

/* ── Helpers ── */
function AddressRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-xs font-semibold text-gray-400 w-28 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-700">{value || '—'}</span>
    </div>
  )
}

export default function AltIsOlustur() {
  const { altKullanici } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [paket_boyutu, setPaketBoyutu] = useState<PaketBoyutu>('Orta')
  const [aciklama, setAciklama] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  /* Build a human-readable pickup address from profile */
  const pickupParts = [
    altKullanici?.mahalle,
    altKullanici?.adres,
    altKullanici?.ilce,
    altKullanici?.il,
  ].filter(Boolean)
  const pickupAddress = pickupParts.length > 0 ? pickupParts.join(', ') : 'Adres bilgisi bulunamadı'

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.alt.isOlustur({ paket_boyutu, aciklama })
      setSuccess(true)
      setTimeout(() => navigate('/alt/islerim'), 2000)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  /* ── Success state ── */
  if (success) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={30} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Talebiniz Alındı</h2>
          <p className="text-sm text-gray-500 mt-2">
            Gönderiniz sisteme kaydedildi. Kurye en kısa sürede paketi teslim alacak.
          </p>
          <p className="text-xs text-gray-400 mt-4">Taleplerim sayfasına yönlendiriliyorsunuz...</p>
          <div className="mt-6 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-emerald-500 animate-[progress_2s_linear_forwards]" style={{ width: '100%' }} />
          </div>
        </div>
      </div>
    )
  }

  const selectedPaket = PAKET_TIPLERI.find(p => p.value === paket_boyutu)!

  return (
    <div className="max-w-xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Yeni Talep</h1>
        <p className="text-sm text-gray-500 mt-0.5">Paket bilgilerini doldurun, kurye size gelsin.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all text-sm font-bold ${
                i < step
                  ? 'bg-blue-600 text-white'
                  : i === step
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-gray-100 text-gray-400'
              }`}>
                {i < step ? <Check size={16} /> : i + 1}
              </div>
              <p className={`text-xs mt-1.5 font-medium hidden sm:block ${
                i <= step ? 'text-blue-600' : 'text-gray-400'
              }`}>{label}</p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 transition-all ${i < step ? 'bg-blue-600' : 'bg-gray-100'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <form onSubmit={submit}>
        <div className="card overflow-hidden">
          {/* Card header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              {step === 0
                ? <Package size={16} className="text-blue-600" />
                : <Check size={16} className="text-blue-600" />
              }
            </div>
            <h2 className="font-semibold text-gray-800">{STEPS[step]}</h2>
          </div>

          <div className="p-6 space-y-6">
            {/* ─── Step 0: Package info ─── */}
            {step === 0 && (
              <>
                {/* Package size buttons */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-3">
                    Paket Boyutu <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {PAKET_TIPLERI.map(p => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPaketBoyutu(p.value)}
                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all ${
                          paket_boyutu === p.value
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-100 hover:border-gray-200 bg-white'
                        }`}
                      >
                        <Package
                          size={18}
                          className={paket_boyutu === p.value ? 'text-blue-600' : 'text-gray-400'}
                        />
                        <span className={`text-xs font-semibold leading-tight text-center ${
                          paket_boyutu === p.value ? 'text-blue-700' : 'text-gray-600'
                        }`}>{p.label}</span>
                        <span className="text-[10px] text-gray-400 leading-tight text-center hidden sm:block">
                          {p.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Açıklama <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
                  </label>
                  <textarea
                    value={aciklama}
                    onChange={e => setAciklama(e.target.value)}
                    rows={3}
                    placeholder="Kurye için özel not, kırılgan içerik vb..."
                    className="input-field resize-none"
                  />
                </div>

                {/* Pickup address — read-only */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin size={14} className="text-blue-500" />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Alış Adresi</span>
                    <span className="ml-auto text-xs text-gray-400 bg-gray-200 rounded px-1.5 py-0.5">Profilden</span>
                  </div>
                  {altKullanici ? (
                    <div className="space-y-2">
                      {altKullanici.il && <AddressRow label="İl / İlçe" value={`${altKullanici.il}${altKullanici.ilce ? ' / ' + altKullanici.ilce : ''}`} />}
                      {altKullanici.mahalle && <AddressRow label="Mahalle" value={altKullanici.mahalle} />}
                      <AddressRow label="Açık Adres" value={altKullanici.adres ?? 'Belirtilmemiş'} />
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">{pickupAddress}</p>
                  )}
                </div>
              </>
            )}

            {/* ─── Step 1: Summary ─── */}
            {step === 1 && (
              <div className="space-y-4">
                {error && (
                  <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                    {error}
                  </div>
                )}

                {/* Pickup */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={13} className="text-blue-500" />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Alış Noktası</span>
                  </div>
                  <p className="text-sm text-gray-700">{pickupAddress}</p>
                </div>

                {/* Destination — intentionally vague */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 size={13} className="text-emerald-500" />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Teslim Noktası</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <Building2 size={13} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Merkez Depo</p>
                      <p className="text-xs text-gray-400">Şirket deposuna teslim edilecek</p>
                    </div>
                  </div>
                </div>

                {/* Package + note */}
                <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-0.5">Paket Tipi</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedPaket.label}</p>
                    <p className="text-xs text-gray-500">{selectedPaket.desc}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <Package size={22} className="text-blue-600" />
                  </div>
                </div>

                {aciklama && (
                  <div className="bg-amber-50 rounded-xl p-4">
                    <p className="text-xs font-bold text-amber-600 mb-1.5">Not</p>
                    <p className="text-sm text-gray-600">{aciklama}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(s => Math.max(s - 1, 0))}
              disabled={step === 0}
              className="btn-secondary flex items-center gap-2 disabled:opacity-30"
            >
              <ChevronLeft size={15} /> Geri
            </button>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep(s => s + 1)}
                className="btn-primary flex items-center gap-2"
              >
                İleri <ChevronRight size={15} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center gap-2 px-6"
              >
                {loading ? (
                  <><Loader2 size={15} className="animate-spin" /> Gönderiliyor...</>
                ) : (
                  <><Check size={15} /> Talebi Oluştur</>
                )}
              </button>
            )}
          </div>
        </div>
      </form>

      <p className="text-center text-xs text-gray-400 mt-4">
        Adım {step + 1} / {STEPS.length}
      </p>
    </div>
  )
}
