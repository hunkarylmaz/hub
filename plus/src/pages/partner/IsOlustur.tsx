import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin, User, Package, ChevronRight, ChevronLeft,
  Check, Loader2, ArrowRight, Copy, RotateCcw
} from 'lucide-react'
import { ILLER } from '../../lib/locations'
import { api, IsForm, PaketBoyutu, HizmetTuru, HIZMET_TURU_LABELS } from '../../lib/api'

const HIZMET_TURLERI: { value: HizmetTuru; desc: string }[] = [
  { value: 'adres_dagitim', desc: 'Adresten adrese standart teslimat' },
  { value: 'adres_toplama', desc: 'Adreslerden toplama merkeze taşıma' },
  { value: 'otogar_alis',   desc: 'Otogar / terminal den alış' },
  { value: 'kargo_geri',    desc: 'İade / kargoya geri gönderme' },
]

const STEPS = ['Alış Noktası', 'Bırakılma Noktası', 'Kişi Bilgileri', 'Paket & Zaman', 'Özet']

const PAKET_TIPLERI: { value: PaketBoyutu; label: string; desc: string; emoji: string }[] = [
  { value: 'Zarf',   label: 'Zarf',    desc: 'A4 zarf, belge',        emoji: '✉️' },
  { value: 'Küçük',  label: 'Küçük',   desc: 'Ayakkabı kutusu',       emoji: '📦' },
  { value: 'Orta',   label: 'Orta',    desc: 'Orta boy kutu',         emoji: '🗃️' },
  { value: 'Büyük',  label: 'Büyük',   desc: 'Büyük karton kutu',     emoji: '📫' },
  { value: 'Koli',   label: 'Koli',    desc: 'Kargo kolisi, hacimli', emoji: '🏗️' },
]

const EMPTY: IsForm = {
  alis_il: '', alis_ilce: '', alis_mahalle: '', alis_adres: '',
  birakilis_il: '', birakilis_ilce: '', birakilis_mahalle: '', birakilis_adres: '',
  gonderici_ad: '', gonderici_telefon: '',
  alici_ad: '', alici_telefon: '',
  paket_boyutu: 'Orta', aciklama: '', alinma_saati: '',
  is_turu: 'adres_dagitim',
}

function LocationBlock({ prefix, form, set }: {
  prefix: 'alis' | 'birakilis'
  form: IsForm
  set: (f: IsForm) => void
}) {
  const ilKey   = `${prefix}_il`   as keyof IsForm
  const ilceKey = `${prefix}_ilce` as keyof IsForm
  const mhllKey = `${prefix}_mahalle` as keyof IsForm
  const adrKey  = `${prefix}_adres`   as keyof IsForm

  const secilenIl = ILLER.find(i => i.il === form[ilKey])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">İl *</label>
          <select value={form[ilKey] as string} required
            onChange={e => set({ ...form, [ilKey]: e.target.value, [ilceKey]: '' })}
            className="input-field">
            <option value="">İl seçin...</option>
            {ILLER.map(i => <option key={i.il} value={i.il}>{i.il}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">İlçe *</label>
          <select value={form[ilceKey] as string} required
            disabled={!form[ilKey]}
            onChange={e => set({ ...form, [ilceKey]: e.target.value })}
            className="input-field disabled:opacity-50">
            <option value="">İlçe seçin...</option>
            {secilenIl?.ilceler.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mahalle / Semt</label>
        <input type="text" value={form[mhllKey] as string}
          onChange={e => set({ ...form, [mhllKey]: e.target.value })}
          placeholder="Mahalle veya semt adı"
          className="input-field" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Açık Adres *</label>
        <textarea value={form[adrKey] as string} required rows={3}
          onChange={e => set({ ...form, [adrKey]: e.target.value })}
          placeholder="Sokak, kapı no, kat/daire..."
          className="input-field resize-none" />
      </div>
    </div>
  )
}

export default function IsOlustur() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<IsForm>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<{ id: number; qr_kodu: string } | null>(null)

  function next() { setStep(s => Math.min(s + 1, STEPS.length - 1)) }
  function prev() { setStep(s => Math.max(s - 1, 0)) }

  function copyAlis() {
    setForm(f => ({
      ...f,
      birakilis_il: f.alis_il, birakilis_ilce: f.alis_ilce,
      birakilis_mahalle: f.alis_mahalle, birakilis_adres: f.alis_adres,
    }))
  }

  function validateStep() {
    if (step === 0) return form.alis_il && form.alis_ilce && form.alis_adres
    if (step === 1) return form.birakilis_il && form.birakilis_ilce && form.birakilis_adres
    if (step === 2) return form.gonderici_ad && form.gonderici_telefon && form.alici_ad && form.alici_telefon
    if (step === 3) return form.paket_boyutu && form.alinma_saati
    return true
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await api.partner.isOlustur(form)
      setCreated({ id: res.id, qr_kodu: res.qr_kodu })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // Success screen
  if (created) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="card p-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">İş Oluşturuldu!</h2>
          <p className="text-sm text-gray-500 mt-2 mb-6">
            #{String(created.id).padStart(4,'0')} numaralı iş havuza eklendi. Taşıyıcılar QR kodu ile teslim alacak.
          </p>

          {/* QR Code placeholder */}
          <div className="w-48 h-48 mx-auto bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center mb-6">
            <Package size={40} className="text-gray-300 mb-2" />
            <p className="text-xs font-mono text-gray-500">{created.qr_kodu}</p>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <div className="flex-1 bg-gray-50 rounded-xl px-4 py-2.5 text-sm font-mono text-gray-600 text-left truncate">
              {created.qr_kodu}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(created.qr_kodu)}
              className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500">
              <Copy size={16} />
            </button>
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setCreated(null); setForm(EMPTY); setStep(0) }}
              className="btn-secondary flex-1 flex items-center justify-center gap-2">
              <RotateCcw size={15} /> Yeni İş
            </button>
            <button onClick={() => navigate(`/partner/is/${created.id}`)}
              className="btn-primary flex-1 flex items-center justify-center gap-2">
              Detaya Git <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const stepIcons = [MapPin, MapPin, User, Package, Check]
  const ActiveStepIcon = stepIcons[step]

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Yeni İş Oluştur</h1>
        <p className="text-sm text-gray-500 mt-0.5">Teslimat bilgilerini doldurun, iş otomatik havuza düşer.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((label, i) => {
          const StepIcon = stepIcons[i]
          return (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  i < step ? 'bg-primary-600 text-white' :
                  i === step ? 'bg-primary-600 text-white ring-4 ring-primary-100' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {i < step ? <Check size={16} /> : <StepIcon size={16} />}
                </div>
                <p className={`text-xs mt-1.5 font-medium hidden sm:block ${
                  i <= step ? 'text-primary-600' : 'text-gray-400'
                }`}>{label}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 transition-all ${i < step ? 'bg-primary-600' : 'bg-gray-100'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Card */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center">
            <ActiveStepIcon size={16} className="text-primary-600" />
          </div>
          <h2 className="font-semibold text-gray-800">{STEPS[step]}</h2>
        </div>

        <form onSubmit={submit}>
          <div className="p-6">
            {/* Step 0: Alış noktası */}
            {step === 0 && (
              <LocationBlock prefix="alis" form={form} set={setForm} />
            )}

            {/* Step 1: Bırakılma noktası */}
            {step === 1 && (
              <div className="space-y-4">
                <button type="button" onClick={copyAlis}
                  className="flex items-center gap-2 text-sm text-primary-600 font-semibold hover:underline">
                  <Copy size={14} /> Alış noktasıyla aynı bilgileri kullan
                </button>
                <LocationBlock prefix="birakilis" form={form} set={setForm} />
              </div>
            )}

            {/* Step 2: Kişi bilgileri */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Gönderici</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ad Soyad *</label>
                      <input type="text" value={form.gonderici_ad} required
                        onChange={e => setForm(f => ({ ...f, gonderici_ad: e.target.value }))}
                        placeholder="Ahmet Yılmaz" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Telefon *</label>
                      <input type="tel" value={form.gonderici_telefon} required
                        onChange={e => setForm(f => ({ ...f, gonderici_telefon: e.target.value }))}
                        placeholder="05XX XXX XX XX" className="input-field" />
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-5">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Alıcı</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ad Soyad *</label>
                      <input type="text" value={form.alici_ad} required
                        onChange={e => setForm(f => ({ ...f, alici_ad: e.target.value }))}
                        placeholder="Mehmet Demir" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Telefon *</label>
                      <input type="tel" value={form.alici_telefon} required
                        onChange={e => setForm(f => ({ ...f, alici_telefon: e.target.value }))}
                        placeholder="05XX XXX XX XX" className="input-field" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Paket & Zaman */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-3">Hizmet Türü *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {HIZMET_TURLERI.map(t => (
                      <button key={t.value} type="button"
                        onClick={() => setForm(f => ({ ...f, is_turu: t.value }))}
                        className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                          form.is_turu === t.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-100 hover:border-gray-200 bg-white'
                        }`}>
                        <div className={`w-3 h-3 rounded-full mt-0.5 shrink-0 ${form.is_turu === t.value ? 'bg-blue-500' : 'bg-gray-200'}`} />
                        <div>
                          <p className={`text-sm font-semibold ${form.is_turu === t.value ? 'text-blue-700' : 'text-gray-700'}`}>
                            {HIZMET_TURU_LABELS[t.value]}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-3">Paket Boyutu *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {PAKET_TIPLERI.map(p => (
                      <button key={p.value} type="button"
                        onClick={() => setForm(f => ({ ...f, paket_boyutu: p.value }))}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          form.paket_boyutu === p.value
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-100 hover:border-gray-200 bg-white'
                        }`}>
                        <span className="text-2xl">{p.emoji}</span>
                        <span className={`text-xs font-semibold ${form.paket_boyutu === p.value ? 'text-primary-600' : 'text-gray-700'}`}>{p.label}</span>
                        <span className="text-xs text-gray-400 text-center leading-tight">{p.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Alınma Tarihi ve Saati *</label>
                  <input type="datetime-local" value={form.alinma_saati} required
                    min={new Date().toISOString().slice(0, 16)}
                    onChange={e => setForm(f => ({ ...f, alinma_saati: e.target.value }))}
                    className="input-field" />
                  <p className="text-xs text-gray-400 mt-1">Paketi teslim almak istediğiniz tarih ve saat</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Özel Not <span className="text-gray-400 font-normal">(isteğe bağlı)</span></label>
                  <textarea value={form.aciklama} rows={3}
                    onChange={e => setForm(f => ({ ...f, aciklama: e.target.value }))}
                    placeholder="Taşıyıcıya iletilecek özel not..."
                    className="input-field resize-none" />
                </div>
              </div>
            )}

            {/* Step 4: Özet */}
            {step === 4 && (
              <div className="space-y-4">
                {error && (
                  <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                      <MapPin size={12} className="text-primary-500" /> Alış Noktası
                    </h4>
                    <p className="text-sm font-semibold text-gray-800">{form.alis_il} / {form.alis_ilce}</p>
                    {form.alis_mahalle && <p className="text-xs text-gray-500">{form.alis_mahalle}</p>}
                    <p className="text-xs text-gray-500">{form.alis_adres}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                      <MapPin size={12} className="text-emerald-500" /> Bırakılma Noktası
                    </h4>
                    <p className="text-sm font-semibold text-gray-800">{form.birakilis_il} / {form.birakilis_ilce}</p>
                    {form.birakilis_mahalle && <p className="text-xs text-gray-500">{form.birakilis_mahalle}</p>}
                    <p className="text-xs text-gray-500">{form.birakilis_adres}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Gönderici</h4>
                    <p className="text-sm font-semibold text-gray-800">{form.gonderici_ad}</p>
                    <p className="text-xs text-gray-500">{form.gonderici_telefon}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Alıcı</h4>
                    <p className="text-sm font-semibold text-gray-800">{form.alici_ad}</p>
                    <p className="text-xs text-gray-500">{form.alici_telefon}</p>
                  </div>
                </div>
                <div className="bg-primary-50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-primary-600 uppercase tracking-wide">Paket Boyutu</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{form.paket_boyutu}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-primary-600 uppercase tracking-wide">Alınma Saati</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">
                      {form.alinma_saati ? new Date(form.alinma_saati).toLocaleString('tr-TR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—'}
                    </p>
                  </div>
                </div>
                {form.aciklama && (
                  <div className="bg-amber-50 rounded-xl p-4">
                    <p className="text-xs font-bold text-amber-600 mb-1">Not</p>
                    <p className="text-sm text-gray-600">{form.aciklama}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <button type="button" onClick={prev} disabled={step === 0}
              className="btn-secondary flex items-center gap-2 disabled:opacity-30">
              <ChevronLeft size={16} /> Geri
            </button>

            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next} disabled={!validateStep()}
                className="btn-primary flex items-center gap-2">
                İleri <ChevronRight size={16} />
              </button>
            ) : (
              <button type="submit" disabled={loading}
                className="btn-primary flex items-center gap-2 px-6">
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> Oluşturuluyor...</>
                  : <><Check size={16} /> İşi Oluştur</>
                }
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Step count */}
      <p className="text-center text-xs text-gray-400 mt-4">
        Adım {step + 1} / {STEPS.length}
      </p>
    </div>
  )
}
