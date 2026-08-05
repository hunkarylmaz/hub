import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Loader2, AlertCircle, X, MoreVertical, Check, Bike, Coffee, WifiOff, CheckCircle } from 'lucide-react'
import { api, Kurye } from '../lib/api'

// ── helpers ───────────────────────────────────────────────────────────────────
const ODEME_TIPLERI = ['Nakit', 'Kredi Kartı', 'Online', 'Online Yemek Kartı', 'Yemek Kartı']
const CALISMA_TIPLERI = ['Paket Başı', 'Km Aralığı', 'Komisyon', 'Paket + Km', 'Saatlik Ücret', 'Çoklu Paket']
const DURUMLAR: Kurye['durum'][] = ['Müsait', 'Dağıtımda', 'Mola', 'Çevrimdışı']

function parseJSON<T>(val: string | null | undefined, fallback: T): T {
  try { return val ? JSON.parse(val) : fallback } catch { return fallback }
}

function durumDot(durum: Kurye['durum']) {
  const map: Record<string, string> = { 'Müsait': 'bg-emerald-500', 'Dağıtımda': 'bg-blue-500', 'Mola': 'bg-amber-400', 'Çevrimdışı': 'bg-gray-300' }
  return map[durum] || 'bg-gray-300'
}

function durumIcon(durum: Kurye['durum']) {
  if (durum === 'Dağıtımda') return <Bike size={13} className="text-blue-500" />
  if (durum === 'Mola') return <Coffee size={13} className="text-amber-500" />
  if (durum === 'Çevrimdışı') return <WifiOff size={13} className="text-gray-400" />
  return <CheckCircle size={13} className="text-emerald-500" />
}

// ── Limit Modal ───────────────────────────────────────────────────────────────
function LimitModal({ kurye, onClose, onSave }: { kurye: Kurye; onClose: () => void; onSave: () => void }) {
  const [limit, setLimit] = useState(kurye.paket_limiti ?? 5)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try { await api.kuryeler.update(kurye.id, { paket_limiti: limit }); onSave(); onClose() }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Paket Taşıma Limiti</p>
            <p className="text-sm font-semibold text-gray-800">{kurye.ad}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
            <span className="mt-0.5">ⓘ</span>
            <span>Kurye aynı anda maximum kaç paket taşıyabilir?</span>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Paket Limiti</label>
            <input
              type="number" min={1} max={20} value={limit}
              onChange={e => setLimit(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">İptal</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60 font-medium">
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Ödeme Modal ───────────────────────────────────────────────────────────────
function OdemeModal({ kurye, onClose, onSave }: { kurye: Kurye; onClose: () => void; onSave: () => void }) {
  const [selected, setSelected] = useState<string[]>(parseJSON<string[]>(kurye.odeme_tipleri, ['Nakit', 'Kredi Kartı']))
  const [saving, setSaving] = useState(false)

  function toggle(tip: string) {
    setSelected(prev => prev.includes(tip) ? prev.filter(t => t !== tip) : [...prev, tip])
  }

  async function handleSave() {
    setSaving(true)
    try { await api.kuryeler.update(kurye.id, { odeme_tipleri: selected }); onSave(); onClose() }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Ödeme Yöntemleri</p>
            <p className="text-sm font-semibold text-gray-800">{kurye.ad}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-3">
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
            <span className="mt-0.5">ⓘ</span>
            <span>Kurye hangi ödeme yöntemlerini kabul edebilir?</span>
          </div>
          {ODEME_TIPLERI.map(tip => (
            <label key={tip} onClick={() => toggle(tip)} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
              <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${selected.includes(tip) ? 'bg-primary-600 border-primary-600' : 'border-gray-300'}`}>
                {selected.includes(tip) && <Check size={12} className="text-white" />}
              </div>
              <span className="text-sm text-gray-700">{tip}</span>
            </label>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">İptal</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60 font-medium">
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Finans (Çalışma Tipi) Modal ───────────────────────────────────────────────
function FinansModal({ kurye, onClose, onSave }: { kurye: Kurye; onClose: () => void; onSave: () => void }) {
  const [calisma, setCalisma] = useState(kurye.calisma_tipi || 'Paket Başı')
  const [paketBasi, setPaketBasi] = useState(kurye.paket_basi_ucret ?? 0)
  const [kmBaslangic, setKmBaslangic] = useState(kurye.km_baslangic ?? 0)
  const [kmUcret, setKmUcret] = useState(kurye.km_ucret ?? 0)
  const [komisyon, setKomisyon] = useState(kurye.komisyon_yuzdesi ?? 0)
  const [saatlik, setSaatlik] = useState(kurye.saatlik_ucret ?? 0)
  const [coklu, setCoklu] = useState<number[]>(parseJSON<number[]>(kurye.coklu_paket, [100, 60, 40]))
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await api.kuryeler.update(kurye.id, {
        calisma_tipi: calisma,
        paket_basi_ucret: paketBasi,
        km_baslangic: kmBaslangic,
        km_ucret: kmUcret,
        komisyon_yuzdesi: komisyon,
        saatlik_ucret: saatlik,
        coklu_paket: coklu,
      })
      onSave(); onClose()
    } finally { setSaving(false) }
  }

  function inp(label: string, value: number, onChange: (v: number) => void, suffix = '₺') {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
        <div className="relative">
          <input type="number" min={0} step={0.5} value={value} onChange={e => onChange(Number(e.target.value))}
            className="w-full px-3 py-2 pr-8 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{suffix}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Finans / Çalışma Tipi</p>
            <p className="text-sm font-semibold text-gray-800">{kurye.ad}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-5">
          {/* Çalışma Tipi Seçici */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Çalışma Tipi</label>
            <div className="grid grid-cols-2 gap-2">
              {CALISMA_TIPLERI.map(tip => (
                <button key={tip} type="button" onClick={() => setCalisma(tip)}
                  className={`py-2.5 px-3 text-sm rounded-lg border text-left transition-colors ${calisma === tip ? 'border-primary-600 bg-primary-50 text-primary-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {tip}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Fields */}
          {calisma === 'Paket Başı' && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase">Paket Başı Ayarları</p>
              {inp('Paket Başı Ücret', paketBasi, setPaketBasi)}
            </div>
          )}

          {calisma === 'Km Aralığı' && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase">Km Aralığı Ayarları</p>
              {inp('Başlangıç Ücreti', kmBaslangic, setKmBaslangic)}
              {inp('Km Başı Ücret', kmUcret, setKmUcret)}
            </div>
          )}

          {calisma === 'Komisyon' && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase">Komisyon Ayarları</p>
              {inp('Komisyon Yüzdesi', komisyon, setKomisyon, '%')}
            </div>
          )}

          {calisma === 'Paket + Km' && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase">Paket + Km Ayarları</p>
              {inp('Paket Başı Ücret', paketBasi, setPaketBasi)}
              {inp('Başlangıç Ücreti', kmBaslangic, setKmBaslangic)}
              {inp('Km Başı Ücret', kmUcret, setKmUcret)}
            </div>
          )}

          {calisma === 'Saatlik Ücret' && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase">Saatlik Ücret Ayarları</p>
              {inp('Saat Başı Ücret', saatlik, setSaatlik)}
            </div>
          )}

          {calisma === 'Çoklu Paket' && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase">Çoklu Paket Ücretleri</p>
              <p className="text-xs text-gray-400">Aynı anda çıkan paketlerde sıralı ücret uygulanır.</p>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{i + 1}. Paket Ücreti</label>
                  <div className="relative">
                    <input type="number" min={0} step={0.5}
                      value={coklu[i] ?? 0}
                      onChange={e => {
                        const next = [...coklu]
                        while (next.length <= i) next.push(0)
                        next[i] = Number(e.target.value)
                        setCoklu(next)
                      }}
                      className="w-full px-3 py-2 pr-8 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">₺</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">İptal</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60 font-medium">
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Uygulama Girişi Modal ─────────────────────────────────────────────────────
function KuryeGirisModal({ kurye, onClose, onSave }: { kurye: Kurye; onClose: () => void; onSave: () => void }) {
  const [email, setEmail] = useState(kurye.email || '')
  const [sifre, setSifre] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSave() {
    if (!email.trim()) { setErr('E-posta gerekli'); return }
    setSaving(true); setErr('')
    try {
      const res = await api.kuryeler.setGirisBilgisi(kurye.id, { email, sifre: sifre || undefined })
      setSuccess(res.giris_aktif ? 'Giriş bilgileri kaydedildi' : 'E-posta kaydedildi')
      setSifre('')
      onSave()
      setTimeout(() => setSuccess(''), 2000)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Hata')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Uygulama Girişi</p>
            <p className="text-sm font-semibold text-gray-800">{kurye.ad}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
            <span>ⓘ</span>
            <span>Bu bilgilerle kurye mobil uygulamaya giriş yapabilir. Kurye aktif olduğu sürece hesabı çalışır.</span>
          </div>
          {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
          {success && <p className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">{success}</p>}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${kurye.giris_aktif ? 'bg-emerald-500' : 'bg-gray-300'}`} />
            <p className="text-xs text-gray-500">{kurye.giris_aktif ? 'Uygulama girişi aktif' : 'Uygulama girişi henüz aktif değil'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">E-posta *</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{kurye.giris_aktif ? 'Yeni Şifre (opsiyonel)' : 'Şifre'}</label>
            <input value={sifre} onChange={e => setSifre(e.target.value)} type="password" placeholder="••••••••"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">İptal</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60 font-medium">
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Yeni Kurye Sihirbazı (4 adım) ────────────────────────────────────────────
const KURYE_WIZARD_STEPS = ['Temel Bilgiler', 'Ödeme & Limitler', 'Çalışma Tipi', 'Uygulama Girişi']

function KuryeEkleModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    ad: '', telefon: '', plaka: '',
    odeme_tipleri: ['Nakit', 'Kredi Kartı'] as string[],
    paket_limiti: 5,
    paket_iptali: 0,
    odeme_duzenleme: 1,
    calisma_tipi: 'Paket Başı',
    paket_basi_ucret: 0, km_baslangic: 0, km_ucret: 0,
    komisyon_yuzdesi: 0, saatlik_ucret: 0,
    coklu_paket: [100, 60, 40] as number[],
    email: '', sifre: '',
  })
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)

  const inp = "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"

  function F({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
        {children}
      </div>
    )
  }

  function toggleOdeme(tip: string) {
    setForm(f => ({
      ...f,
      odeme_tipleri: f.odeme_tipleri.includes(tip)
        ? f.odeme_tipleri.filter(t => t !== tip)
        : [...f.odeme_tipleri, tip]
    }))
  }

  function next() {
    setErr('')
    if (step === 0 && !form.ad.trim()) { setErr('Kurye adı zorunlu'); return }
    if (step === KURYE_WIZARD_STEPS.length - 1) { handleSave(); return }
    setStep(s => s + 1)
  }

  async function handleSave() {
    if (form.email && !form.sifre) { setErr('E-posta girildiğinde şifre zorunlu'); return }
    setSaving(true); setErr('')
    try {
      await api.kuryeler.create({
        ad: form.ad,
        telefon: form.telefon || undefined,
        plaka: form.plaka || undefined,
        odeme_tipleri: form.odeme_tipleri,
        paket_limiti: form.paket_limiti,
        paket_iptali: form.paket_iptali,
        odeme_duzenleme: form.odeme_duzenleme,
        calisma_tipi: form.calisma_tipi,
        paket_basi_ucret: form.paket_basi_ucret,
        km_baslangic: form.km_baslangic,
        km_ucret: form.km_ucret,
        komisyon_yuzdesi: form.komisyon_yuzdesi,
        saatlik_ucret: form.saatlik_ucret,
        coklu_paket: form.coklu_paket,
        email: form.email || undefined,
        sifre: form.sifre || undefined,
      })
      onSave(); onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Hata')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[92vh] flex flex-col">
        {/* Header + step indicator */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Yeni Kurye Ekle</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          <div className="flex items-center">
            {KURYE_WIZARD_STEPS.map((label, i) => (
              <div key={i} className={`flex items-center ${i < KURYE_WIZARD_STEPS.length - 1 ? 'flex-1' : ''}`}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${i < step ? 'bg-primary-600 text-white' : i === step ? 'bg-primary-600 text-white ring-4 ring-primary-100' : 'bg-gray-100 text-gray-400'}`}>
                    {i < step ? <Check size={13} /> : i + 1}
                  </div>
                  <span className={`text-[10px] font-medium whitespace-nowrap ${i === step ? 'text-primary-600' : 'text-gray-400'}`}>{label}</span>
                </div>
                {i < KURYE_WIZARD_STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 mb-4 transition-colors ${i < step ? 'bg-primary-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{err}</p>}

          {step === 0 && (
            <div className="space-y-4">
              <F label="Ad Soyad *">
                <input value={form.ad} onChange={e => setForm(f => ({ ...f, ad: e.target.value }))}
                  placeholder="Örn: Ahmet Yılmaz" autoFocus className={inp} />
              </F>
              <div className="grid grid-cols-2 gap-3">
                <F label="Telefon">
                  <input value={form.telefon} onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))}
                    placeholder="0555 123 4567" className={inp} />
                </F>
                <F label="Araç Plakası">
                  <input value={form.plaka} onChange={e => setForm(f => ({ ...f, plaka: e.target.value.toUpperCase() }))}
                    placeholder="34 ABC 123" className={inp} />
                </F>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Kabul Ettiği Ödeme Yöntemleri</label>
                <div className="space-y-2">
                  {ODEME_TIPLERI.map(tip => (
                    <label key={tip} onClick={() => toggleOdeme(tip)}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 ${form.odeme_tipleri.includes(tip) ? 'bg-primary-600 border-primary-600' : 'border-gray-300'}`}>
                        {form.odeme_tipleri.includes(tip) && <Check size={12} className="text-white" />}
                      </div>
                      <span className="text-sm text-gray-700">{tip}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Paket Taşıma Limiti</p>
                    <p className="text-xs text-gray-400">Aynı anda max kaç paket taşıyabilir</p>
                  </div>
                  <span className="text-sm font-semibold text-primary-600">{form.paket_limiti} paket</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">1</span>
                  <input type="range" min={1} max={20} step={1} value={form.paket_limiti}
                    onChange={e => setForm(f => ({ ...f, paket_limiti: Number(e.target.value) }))}
                    className="flex-1 accent-primary-600" />
                  <span className="text-xs text-gray-400">20</span>
                </div>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 5, 10].map(v => (
                    <button key={v} type="button" onClick={() => setForm(f => ({ ...f, paket_limiti: v }))}
                      className={`text-xs px-2 py-1 rounded-md transition-colors ${form.paket_limiti === v ? 'bg-primary-100 text-primary-700 font-medium' : 'text-gray-400 hover:text-gray-600'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase">Yetkiler</p>
                {[
                  { key: 'paket_iptali' as const, label: 'Paket İptali', desc: 'Kurye siparişi iptal edebilir' },
                  { key: 'odeme_duzenleme' as const, label: 'Ödeme Düzenleme', desc: 'Kurye ödeme bilgilerini düzenleyebilir' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                    <Toggle label="" value={form[item.key] === 1} onChange={v => setForm(f => ({ ...f, [item.key]: v ? 1 : 0 }))} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Çalışma Tipi</label>
                <div className="grid grid-cols-3 gap-2">
                  {CALISMA_TIPLERI.map(tip => (
                    <button key={tip} type="button" onClick={() => setForm(f => ({ ...f, calisma_tipi: tip }))}
                      className={`py-2.5 px-3 text-sm rounded-lg border text-left transition-colors ${form.calisma_tipi === tip ? 'border-primary-600 bg-primary-50 text-primary-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {tip}
                    </button>
                  ))}
                </div>
              </div>

              {(form.calisma_tipi === 'Paket Başı' || form.calisma_tipi === 'Paket + Km') && (
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Paket Başı Ayarları</p>
                  <F label="Paket Başı Ücret (₺)">
                    <input type="number" min={0} step={0.5} value={form.paket_basi_ucret}
                      onChange={e => setForm(f => ({ ...f, paket_basi_ucret: Number(e.target.value) }))} className={inp} />
                  </F>
                </div>
              )}
              {(form.calisma_tipi === 'Km Aralığı' || form.calisma_tipi === 'Paket + Km') && (
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Km Ayarları</p>
                  <div className="grid grid-cols-2 gap-3">
                    <F label="Başlangıç Ücreti (₺)">
                      <input type="number" min={0} step={0.5} value={form.km_baslangic}
                        onChange={e => setForm(f => ({ ...f, km_baslangic: Number(e.target.value) }))} className={inp} />
                    </F>
                    <F label="Km Başı Ücret (₺)">
                      <input type="number" min={0} step={0.5} value={form.km_ucret}
                        onChange={e => setForm(f => ({ ...f, km_ucret: Number(e.target.value) }))} className={inp} />
                    </F>
                  </div>
                </div>
              )}
              {form.calisma_tipi === 'Komisyon' && (
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Komisyon Ayarları</p>
                  <F label="Komisyon Yüzdesi (%)">
                    <input type="number" min={0} max={100} step={0.5} value={form.komisyon_yuzdesi}
                      onChange={e => setForm(f => ({ ...f, komisyon_yuzdesi: Number(e.target.value) }))} className={inp} />
                  </F>
                </div>
              )}
              {form.calisma_tipi === 'Saatlik Ücret' && (
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Saatlik Ücret</p>
                  <F label="Saat Başı Ücret (₺)">
                    <input type="number" min={0} step={0.5} value={form.saatlik_ucret}
                      onChange={e => setForm(f => ({ ...f, saatlik_ucret: Number(e.target.value) }))} className={inp} />
                  </F>
                </div>
              )}
              {form.calisma_tipi === 'Çoklu Paket' && (
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Çoklu Paket Ücretleri</p>
                  <p className="text-xs text-gray-400">Aynı anda çıkan paketlerde sıralı ücret uygulanır.</p>
                  <div className="grid grid-cols-5 gap-2">
                    {[0, 1, 2, 3, 4].map(i => (
                      <F key={i} label={`${i + 1}. Paket`}>
                        <input type="number" min={0} step={1} value={form.coklu_paket[i] ?? 0}
                          onChange={e => {
                            const next = [...form.coklu_paket]
                            while (next.length <= i) next.push(0)
                            next[i] = Number(e.target.value)
                            setForm(f => ({ ...f, coklu_paket: next }))
                          }}
                          className="w-full px-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 text-center" />
                      </F>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Uygulama Girişi <span className="font-normal text-gray-400 normal-case">(opsiyonel)</span></p>
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
                  <span>ⓘ</span>
                  <span>Bu bilgilerle kurye mobil uygulamaya giriş yapabilir. Kurye aktif olduğu sürece hesabı çalışır. İstemiyorsanız boş bırakabilirsiniz.</span>
                </div>
                <F label="E-posta">
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="kurye@ornek.com" className={inp} />
                </F>
                {form.email && (
                  <F label="Şifre *">
                    <input type="password" value={form.sifre} onChange={e => setForm(f => ({ ...f, sifre: e.target.value }))}
                      placeholder="••••••••" className={inp} />
                  </F>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/60 rounded-b-2xl">
          <button onClick={step === 0 ? onClose : () => { setErr(''); setStep(s => s - 1) }}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-white transition-colors">
            {step === 0 ? 'İptal' : '← Geri'}
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{step + 1} / {KURYE_WIZARD_STEPS.length}</span>
            <button onClick={next} disabled={saving}
              className="px-5 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60 font-medium flex items-center gap-1.5 transition-colors">
              {saving ? 'Kaydediliyor...' : step === KURYE_WIZARD_STEPS.length - 1 ? 'Kaydet' : 'Devam →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Kurye Düzenle Modal ───────────────────────────────────────────────────────
function KuryeModal({ kurye, onClose, onSave }: { kurye: Kurye; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    ad: kurye.ad,
    telefon: kurye.telefon || '',
    plaka: kurye.plaka || '',
    paket_iptali: kurye.paket_iptali ?? 0,
    odeme_duzenleme: kurye.odeme_duzenleme ?? 1,
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function handleSave() {
    if (!form.ad.trim()) { setErr('Kurye adı zorunlu'); return }
    setSaving(true)
    try {
      await api.kuryeler.update(kurye.id, form)
      onSave(); onClose()
    } catch (e) { setErr(e instanceof Error ? e.message : 'Hata') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Kurye Düzenle</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ad Soyad *</label>
            <input value={form.ad} onChange={e => setForm(f => ({ ...f, ad: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telefon</label>
              <input value={form.telefon} onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Plaka</label>
              <input value={form.plaka} onChange={e => setForm(f => ({ ...f, plaka: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
            </div>
          </div>
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <Toggle label="Paket İptali" value={form.paket_iptali === 1} onChange={v => setForm(f => ({ ...f, paket_iptali: v ? 1 : 0 }))} />
            <Toggle label="Ödeme Düzenleme Açık" value={form.odeme_duzenleme === 1} onChange={v => setForm(f => ({ ...f, odeme_duzenleme: v ? 1 : 0 }))} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">İptal</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60 font-medium">
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700">{label}</span>
      <button type="button" onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full transition-colors relative ${value ? 'bg-primary-600' : 'bg-gray-300'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'left-5' : 'left-0.5'}`} />
      </button>
    </div>
  )
}

// ── Durum Dropdown ────────────────────────────────────────────────────────────
function DurumMenu({ kurye, onUpdate }: { kurye: Kurye; onUpdate: () => void }) {
  const [open, setOpen] = useState(false)

  async function handleDurum(d: Kurye['durum']) {
    setOpen(false)
    await api.kuryeler.setDurum(kurye.id, d)
    onUpdate()
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors hover:bg-gray-50">
        <span className={`w-2 h-2 rounded-full ${durumDot(kurye.durum)}`} />
        {durumIcon(kurye.durum)}
        {kurye.durum}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-40">
            {DURUMLAR.map(d => (
              <button key={d} onClick={() => handleDurum(d)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${kurye.durum === d ? 'text-primary-600 font-medium' : 'text-gray-700'}`}>
                <span className={`w-2 h-2 rounded-full ${durumDot(d)}`} />
                {d}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Row 3-dot menu ────────────────────────────────────────────────────────────
function RowMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
        <MoreVertical size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-36">
            <button onClick={() => { setOpen(false); onEdit() }} className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50">Düzenle</button>
            <button onClick={() => { setOpen(false); onDelete() }} className="w-full px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50">Sil</button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
type ModalState =
  | { type: 'yeni' }
  | { type: 'edit'; kurye: Kurye }
  | { type: 'limit'; kurye: Kurye }
  | { type: 'odeme'; kurye: Kurye }
  | { type: 'finans'; kurye: Kurye }
  | { type: 'giris'; kurye: Kurye }
  | null

export default function Kuryeler() {
  const [kuryeler, setKuryeler] = useState<Kurye[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState<ModalState>(null)
  const [page, setPage] = useState(1)
  const PER_PAGE = 10

  const fetchData = useCallback(async () => {
    try { setKuryeler(await api.kuryeler.list()) }
    catch (err) { setError(err instanceof Error ? err.message : 'Veri yüklenemedi') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleDelete(k: Kurye) {
    if (!confirm(`${k.ad} silinsin mi?`)) return
    try { await api.kuryeler.delete(k.id); await fetchData() }
    catch (err) { alert(err instanceof Error ? err.message : 'Hata') }
  }

  const aktif = kuryeler.filter(k => k.aktif)
  const total = aktif.length
  const paged = aktif.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(total / PER_PAGE)

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-600" /></div>
  if (error) return <div className="flex flex-col items-center justify-center py-20 gap-4"><AlertCircle size={32} className="text-red-500" /><p className="text-gray-600">{error}</p><button onClick={fetchData} className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg">Tekrar Dene</button></div>

  return (
    <div>
      {/* Modals */}
      {modal?.type === 'yeni' && <KuryeEkleModal onClose={() => setModal(null)} onSave={fetchData} />}
      {modal?.type === 'edit' && <KuryeModal kurye={modal.kurye} onClose={() => setModal(null)} onSave={fetchData} />}
      {modal?.type === 'limit' && <LimitModal kurye={modal.kurye} onClose={() => setModal(null)} onSave={fetchData} />}
      {modal?.type === 'odeme' && <OdemeModal kurye={modal.kurye} onClose={() => setModal(null)} onSave={fetchData} />}
      {modal?.type === 'finans' && <FinansModal kurye={modal.kurye} onClose={() => setModal(null)} onSave={fetchData} />}
      {modal?.type === 'giris' && <KuryeGirisModal kurye={modal.kurye} onClose={() => setModal(null)} onSave={fetchData} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Kurye Yönetimi</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} aktif kurye</p>
        </div>
        <button onClick={() => setModal({ type: 'yeni' })}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors font-medium">
          <Plus size={16} /> Yeni Kurye
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Müsait', count: kuryeler.filter(k => k.durum === 'Müsait' && k.aktif).length, color: 'text-emerald-600', dot: 'bg-emerald-500' },
          { label: 'Dağıtımda', count: kuryeler.filter(k => k.durum === 'Dağıtımda' && k.aktif).length, color: 'text-blue-600', dot: 'bg-blue-500' },
          { label: 'Mola', count: kuryeler.filter(k => k.durum === 'Mola' && k.aktif).length, color: 'text-amber-600', dot: 'bg-amber-400' },
          { label: 'Çevrimdışı', count: kuryeler.filter(k => k.durum === 'Çevrimdışı' && k.aktif).length, color: 'text-gray-500', dot: 'bg-gray-300' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
            <div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {['KURYE ADI', 'TELEFON', 'PLAKA', 'PAKET İPTALİ', 'ÖDEME DÜZENLEME', 'ÇALIŞMA TİPİ', 'ARAÇLAR', 'DURUM', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-12 text-gray-400 text-sm">Kurye bulunamadı</td></tr>
            ) : (
              paged.map(k => {
                const odTipleri = parseJSON<string[]>(k.odeme_tipleri, ['Nakit'])
                return (
                  <tr key={k.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    {/* Ad */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xs shrink-0">
                          {k.ad.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 whitespace-nowrap">{k.ad}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-gray-400">#{k.id}</span>
                            {k.giris_aktif && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded ring-1 ring-inset ring-emerald-100">App Aktif</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Telefon */}
                    <td className="px-4 py-3 text-sm text-gray-600">{k.telefon || '—'}</td>
                    {/* Plaka */}
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">{k.plaka || '—'}</td>
                    {/* Paket İptali */}
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${k.paket_iptali ? 'text-emerald-600' : 'text-red-500'}`}>
                        {k.paket_iptali ? 'EVET' : 'HAYIR'}
                      </span>
                    </td>
                    {/* Ödeme Düzenleme */}
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${k.odeme_duzenleme ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {k.odeme_duzenleme ? 'AÇIK' : 'KAPALI'}
                      </span>
                    </td>
                    {/* Çalışma Tipi */}
                    <td className="px-4 py-3 text-sm text-gray-700">{k.calisma_tipi || 'Paket Başı'}</td>
                    {/* Araçlar */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        <button onClick={() => setModal({ type: 'limit', kurye: k })}
                          className="text-xs font-medium px-2 py-1 bg-primary-50 text-primary-600 ring-1 ring-inset ring-primary-100 hover:bg-primary-100 rounded-md transition-colors duration-150">Limit</button>
                        <button onClick={() => setModal({ type: 'odeme', kurye: k })}
                          className="text-xs font-medium px-2 py-1 bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100 hover:bg-indigo-100 rounded-md transition-colors duration-150">Ödeme</button>
                        <button onClick={() => setModal({ type: 'finans', kurye: k })}
                          className="text-xs font-medium px-2 py-1 bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100 hover:bg-amber-100 rounded-md transition-colors duration-150">Finans</button>
                        <button onClick={() => setModal({ type: 'giris', kurye: k })}
                          className={`text-xs font-medium px-2 py-1 ring-1 ring-inset rounded-md transition-colors duration-150 ${k.giris_aktif ? 'bg-emerald-50 text-emerald-600 ring-emerald-100 hover:bg-emerald-100' : 'bg-gray-50 text-gray-500 ring-gray-200 hover:bg-gray-100'}`}>
                          Uygulama
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-0.5 mt-1">
                        {odTipleri.slice(0, 2).map(t => (
                          <span key={t} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{t}</span>
                        ))}
                        {odTipleri.length > 2 && <span className="text-xs text-gray-400">+{odTipleri.length - 2}</span>}
                      </div>
                    </td>
                    {/* Durum */}
                    <td className="px-4 py-3">
                      <DurumMenu kurye={k} onUpdate={fetchData} />
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <RowMenu onEdit={() => setModal({ type: 'edit', kurye: k })} onDelete={() => handleDelete(k)} />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <span className="text-sm text-gray-500">
            {total === 0 ? '0' : `${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, total)}`} / {total}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page === 1} className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none">İlk</button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none">‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-all duration-150 ${page === p ? 'bg-primary-600 text-white shadow-card' : 'text-gray-500 hover:bg-gray-100'}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none">›</button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages || totalPages === 0} className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none">Son</button>
          </div>
        </div>
      </div>
    </div>
  )
}
