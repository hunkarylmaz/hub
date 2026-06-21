import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Loader2, AlertCircle, X, MoreVertical, ChevronRight, Check } from 'lucide-react'
import { api, Restoran } from '../lib/api'
import { BakiyeHareketiModal } from './PeriyodikRapor'
import KonumSecici from '../components/KonumSecici'

// ── helpers ───────────────────────────────────────────────────────────────────
const CALISMA_TIPLERI = ['Paket Başı', 'Km Aralığı', 'Komisyon', 'Paket + Km', 'Saatlik Ücret', 'Çoklu Paket']

function parseJSON<T>(val: string | null | undefined, fallback: T): T {
  try { return val ? JSON.parse(val) : fallback } catch { return fallback }
}

// ── Toggle helper ─────────────────────────────────────────────────────────────
function Tog({ val, onChange }: { val: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!val)}
      className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${val ? 'bg-primary-600' : 'bg-gray-300'}`}>
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${val ? 'left-7' : 'left-1'}`} />
    </button>
  )
}

// ── Çalışma Tipi Modal (shared with kuryeler) ─────────────────────────────────
function CalismaModal({ label, restoran, onClose, onSave }: { label: string; restoran: Restoran; onClose: () => void; onSave: () => void }) {
  const [calisma, setCalisma] = useState(restoran.calisma_tipi || 'Paket Başı')
  const [paketBasi, setPaketBasi] = useState(restoran.paket_basi_ucret ?? 0)
  const [kmBaslangic, setKmBaslangic] = useState(restoran.km_baslangic ?? 0)
  const [kmUcret, setKmUcret] = useState(restoran.km_ucret ?? 0)
  const [komisyon, setKomisyon] = useState(restoran.komisyon_yuzdesi ?? 0)
  const [saatlik, setSaatlik] = useState(restoran.saatlik_ucret ?? 0)
  const [coklu, setCoklu] = useState<number[]>(parseJSON<number[]>(restoran.coklu_paket, [100, 60, 40]))
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await api.restoranlar.update(restoran.id, { calisma_tipi: calisma, paket_basi_ucret: paketBasi, km_baslangic: kmBaslangic, km_ucret: kmUcret, komisyon_yuzdesi: komisyon, saatlik_ucret: saatlik, coklu_paket: coklu })
      onSave(); onClose()
    } finally { setSaving(false) }
  }

  function Inp({ lbl, value, onChange, suffix = '₺' }: { lbl: string; value: number; onChange: (v: number) => void; suffix?: string }) {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{lbl}</label>
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
            <p className="text-sm font-semibold text-gray-800">{restoran.ad}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-5">
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

          {(calisma === 'Paket Başı' || calisma === 'Paket + Km') && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase">Paket Başı Ayarları</p>
              <Inp lbl="Paket Başı Ücret" value={paketBasi} onChange={setPaketBasi} />
            </div>
          )}
          {(calisma === 'Km Aralığı' || calisma === 'Paket + Km') && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase">Km Ayarları</p>
              <Inp lbl="Başlangıç Ücreti" value={kmBaslangic} onChange={setKmBaslangic} />
              <Inp lbl="Km Başı Ücret" value={kmUcret} onChange={setKmUcret} />
            </div>
          )}
          {calisma === 'Komisyon' && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase">Komisyon Ayarları</p>
              <Inp lbl="Komisyon Yüzdesi" value={komisyon} onChange={setKomisyon} suffix="%" />
            </div>
          )}
          {calisma === 'Saatlik Ücret' && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase">Saatlik Ücret</p>
              <Inp lbl="Saat Başı Ücret" value={saatlik} onChange={setSaatlik} />
            </div>
          )}
          {calisma === 'Çoklu Paket' && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase">Çoklu Paket Ücretleri</p>
              <p className="text-xs text-gray-400">Aynı anda çıkan paketlerde sıralı ücret.</p>
              {[0, 1, 2, 3, 4].map(i => (
                <Inp key={i} lbl={`${i + 1}. Paket Ücreti`} value={coklu[i] ?? 0} onChange={v => {
                  const next = [...coklu]
                  while (next.length <= i) next.push(0)
                  next[i] = v
                  setCoklu(next)
                }} />
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">İptal</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60 font-medium">
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Hazırlanma Süresi Modal ───────────────────────────────────────────────────
function HazirlanmaModal({ restoran, onClose, onSave }: { restoran: Restoran; onClose: () => void; onSave: () => void }) {
  const [sure, setSure] = useState(restoran.hazirlanma_suresi ?? 30)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try { await api.restoranlar.update(restoran.id, { hazirlanma_suresi: sure }); onSave(); onClose() }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase">Hazırlanma Süresi</p>
            <p className="text-sm font-semibold text-gray-800">{restoran.ad}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
            <span>ⓘ</span><span>Sipariş hazırlama süresi ayarı (dakika cinsinden)</span>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Hazırlanma Süresi (dk)</label>
            <div className="flex items-center gap-2">
              {[15, 20, 30, 45, 60].map(v => (
                <button key={v} type="button" onClick={() => setSure(v)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${sure === v ? 'border-primary-600 bg-primary-50 text-primary-700 font-medium' : 'border-gray-200 text-gray-600'}`}>
                  {v}
                </button>
              ))}
            </div>
            <input type="number" min={5} max={180} value={sure} onChange={e => setSure(Number(e.target.value))}
              className="mt-2 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">İptal</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60 font-medium">
            {saving ? '...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Konum Modal ────────────────────────────────────────────────────────────────
function KonumModal({ restoran, onClose, onSave }: { restoran: Restoran; onClose: () => void; onSave: () => void }) {
  const [konum, setKonum] = useState<{ lat: number | null; lon: number | null }>({ lat: restoran.lat ?? null, lon: restoran.lon ?? null })
  const [adres, setAdres] = useState({ adres: restoran.adres || '', ilce: restoran.ilce || '' })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await api.restoranlar.update(restoran.id, { lat: konum.lat, lon: konum.lon, adres: adres.adres || null, ilce: adres.ilce || null })
      onSave(); onClose()
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase">Konum Düzenle</p>
            <p className="text-sm font-semibold text-gray-800">{restoran.ad}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-3">
          <KonumSecici
            lat={konum.lat}
            lon={konum.lon}
            onChange={(lat, lon) => setKonum({ lat, lon })}
            onAdresBulundu={s => setAdres(a => ({ adres: s.display_name, ilce: s.ilce || a.ilce }))}
            height={320}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Açık Adres</label>
              <input value={adres.adres} onChange={e => setAdres(a => ({ ...a, adres: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">İlçe</label>
              <input value={adres.ilce} onChange={e => setAdres(a => ({ ...a, ilce: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
            </div>
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

// ── Yönetim Paneli Modal ──────────────────────────────────────────────────────
type YonetimTab = 'ayarlar' | 'yonetim' | 'bilgiler'

function YonetimPaneliModal({ restoran, onClose, onSave }: { restoran: Restoran; onClose: () => void; onSave: () => void }) {
  const [tab, setTab] = useState<YonetimTab>('ayarlar')
  const [settings, setSettings] = useState({
    otomatik_yazdir: restoran.otomatik_yazdir ?? 1,
    kurye_konum_takip: restoran.kurye_konum_takip ?? 0,
    kurye_numara_goruntu: restoran.kurye_numara_goruntu ?? 1,
    restoran_teslimat: restoran.restoran_teslimat ?? 1,
    siparis_hazir: restoran.siparis_hazir ?? 0,
    pos_kullanim: restoran.pos_kullanim ?? 0,
    odeme_duzenleme: restoran.odeme_duzenleme ?? 1,
    harita_konum: restoran.harita_konum ?? 1,
  })
  const [bilgiler, setBilgiler] = useState({
    adres: restoran.adres || '',
    ilce: restoran.ilce || '',
    email: restoran.email || '',
    iban: restoran.iban || '',
    iban_sahibi: restoran.iban_sahibi || '',
  })
  const [showCalisma, setShowCalisma] = useState(false)
  const [showHazirlanma, setShowHazirlanma] = useState(false)
  const [showKonum, setShowKonum] = useState(false)
  const [showMuhasebe, setShowMuhasebe] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')

  async function saveSettings() {
    setSaving(true)
    try {
      await api.restoranlar.update(restoran.id, settings)
      setSuccess('Kaydedildi')
      setTimeout(() => setSuccess(''), 2000)
      onSave()
    } finally { setSaving(false) }
  }

  async function saveBilgiler() {
    setSaving(true)
    try {
      await api.restoranlar.update(restoran.id, bilgiler)
      setSuccess('Kaydedildi')
      setTimeout(() => setSuccess(''), 2000)
      onSave()
    } finally { setSaving(false) }
  }

  const ayarlarList = [
    { key: 'otomatik_yazdir', label: 'Otomatik Yazdırma', desc: 'Gelen siparişleri otomatik yazdır' },
    { key: 'kurye_konum_takip', label: 'Kurye Konum Takibi', desc: 'Kurye konumunu müşteriye göster' },
    { key: 'kurye_numara_goruntu', label: 'Kurye Numarası Görünümü', desc: 'Kurye telefon numarasını göster' },
    { key: 'restoran_teslimat', label: 'Restoran Teslimatı', desc: 'Restoran kendi teslimat yapar' },
    { key: 'siparis_hazir', label: 'Siparişi Hazır Açma/Kapatma', desc: 'Sipariş hazır özelliğini aktifleştir' },
    { key: 'pos_kullanim', label: 'POS Kullanımı', desc: 'POS cihazı kullanımı' },
    { key: 'odeme_duzenleme', label: 'Ödeme Düzenleme', desc: 'Restoran ödeme bilgilerini düzenleyebilir' },
    { key: 'harita_konum', label: 'Harita Konum Zorunluluğu', desc: 'Sipariş oluştururken haritadan konum seçimi zorunlu' },
  ] as const

  const yonetimList = [
    { key: 'calisma', label: 'Çalışma Tipi', desc: 'Komisyon ve ödeme ayarları', onClick: () => setShowCalisma(true), disabled: false },
    { key: 'hazirlanma', label: 'Hazırlanma Süresi', desc: 'Sipariş hazırlama süresi ayarı', onClick: () => setShowHazirlanma(true), disabled: false },
    { key: 'konum', label: 'Konum Düzenle', desc: 'Harita üzerinde konum ayarla', onClick: () => setShowKonum(true), disabled: false },
    { key: 'muhasebe', label: 'Muhasebe Yönetim', desc: 'Ödeme ve finans kayıtları', onClick: () => setShowMuhasebe(true), disabled: false },
    { key: 'engelli', label: 'Engelli Kuryeler', desc: 'Kurye engelleme listesi', onClick: () => {}, disabled: true },
    { key: 'kullanici', label: 'İşletme Kullanıcıları', desc: 'Restoran kullanıcı yönetimi', onClick: () => {}, disabled: true },
  ]

  return (
    <>
      {showCalisma && <CalismaModal label="Çalışma Tipi" restoran={restoran} onClose={() => setShowCalisma(false)} onSave={onSave} />}
      {showHazirlanma && <HazirlanmaModal restoran={restoran} onClose={() => setShowHazirlanma(false)} onSave={onSave} />}
      {showKonum && <KonumModal restoran={restoran} onClose={() => setShowKonum(false)} onSave={onSave} />}
      {showMuhasebe && <BakiyeHareketiModal entity_type="restoran" entity_id={restoran.id} entity_ad={restoran.ad} onClose={() => setShowMuhasebe(false)} />}

      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-primary-50/40">
            <div>
              <p className="text-xs font-bold text-primary-600 uppercase tracking-wide">Restoran Yönetimi</p>
              <p className="text-sm font-semibold text-gray-800">{restoran.ad}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Left tabs */}
            <div className="w-52 border-r border-gray-100 py-2 shrink-0">
              {[
                { key: 'ayarlar' as YonetimTab, label: 'Ayarlar', sub: 'Durum ve özellik ayarları', icon: '⚙️' },
                { key: 'yonetim' as YonetimTab, label: 'Yönetim', sub: 'Yönetim işlemleri', icon: '👥' },
                { key: 'bilgiler' as YonetimTab, label: 'Bilgiler', sub: 'Restoran bilgileri', icon: 'ℹ️' },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors rounded-lg mx-1 ${tab === t.key ? 'bg-primary-600 text-white' : 'hover:bg-gray-50 text-gray-700'}`}>
                  <span className="text-base mt-0.5">{t.icon}</span>
                  <div>
                    <p className={`text-sm font-medium ${tab === t.key ? 'text-white' : 'text-gray-800'}`}>{t.label}</p>
                    <p className={`text-xs ${tab === t.key ? 'text-primary-100' : 'text-gray-400'}`}>{t.sub}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Right content */}
            <div className="flex-1 overflow-y-auto p-5">
              {success && <div className="mb-3 p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-700 text-center">{success}</div>}

              {tab === 'ayarlar' && (
                <div className="space-y-1">
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700 mb-4">
                    <span>ⓘ</span><span>Restoran özellik ve durum ayarlarını buradan yönetebilirsiniz.</span>
                  </div>
                  {ayarlarList.map(item => (
                    <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{item.label}</p>
                        <p className="text-xs text-gray-400">{item.desc}</p>
                      </div>
                      <Tog val={settings[item.key] === 1} onChange={v => setSettings(s => ({ ...s, [item.key]: v ? 1 : 0 }))} />
                    </div>
                  ))}
                  <div className="pt-3">
                    <button onClick={saveSettings} disabled={saving} className="w-full py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-60 font-medium">
                      {saving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                  </div>
                </div>
              )}

              {tab === 'yonetim' && (
                <div className="space-y-1">
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700 mb-4">
                    <span>ⓘ</span><span>Restoran yönetim işlemlerini buradan yapabilirsiniz.</span>
                  </div>
                  {yonetimList.map(item => (
                    <button key={item.key} onClick={item.onClick} disabled={item.disabled}
                      className={`w-full flex items-center justify-between py-3.5 px-3 border border-gray-100 rounded-xl transition-colors mb-2 ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-800">{item.label}</p>
                        <p className="text-xs text-gray-400">{item.desc}</p>
                      </div>
                      {item.disabled
                        ? <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Yakında</span>
                        : <ChevronRight size={16} className="text-gray-400" />}
                    </button>
                  ))}
                </div>
              )}

              {tab === 'bilgiler' && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700 mb-4">
                    <span>ⓘ</span><span>Restoran iletişim ve finansal bilgileri.</span>
                  </div>
                  {[
                    { key: 'adres' as const, label: 'ADRES', type: 'text', full: true },
                    { key: 'ilce' as const, label: 'ŞEHİR / İLÇE', type: 'text', full: false },
                    { key: 'email' as const, label: 'E-MAİL', type: 'email', full: false },
                    { key: 'iban' as const, label: 'IBAN', type: 'text', full: false },
                    { key: 'iban_sahibi' as const, label: 'IBAN SAHİBİ', type: 'text', full: false },
                  ].map(f => (
                    <div key={f.key} className="p-3 border border-gray-100 rounded-xl">
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{f.label}</label>
                      <input type={f.type} value={bilgiler[f.key]} onChange={e => setBilgiler(b => ({ ...b, [f.key]: e.target.value }))}
                        placeholder="—"
                        className="w-full text-sm text-gray-800 bg-transparent border-0 outline-none placeholder-gray-300" />
                    </div>
                  ))}
                  <button onClick={saveBilgiler} disabled={saving} className="w-full py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-60 font-medium">
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Yeni / Düzenle Modal ──────────────────────────────────────────────────────
function RestoranModal({ restoran, onClose, onSave }: { restoran?: Restoran; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ ad: restoran?.ad || '', adres: restoran?.adres || '', telefon: restoran?.telefon || '', ilce: restoran?.ilce || '' })
  const [konum, setKonum] = useState<{ lat: number | null; lon: number | null }>({ lat: restoran?.lat ?? null, lon: restoran?.lon ?? null })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function handleSave() {
    if (!form.ad.trim()) { setErr('Restoran adı zorunlu'); return }
    setSaving(true)
    try {
      const data = { ...form, lat: konum.lat, lon: konum.lon }
      if (restoran) await api.restoranlar.update(restoran.id, data)
      else await api.restoranlar.create(data)
      onSave(); onClose()
    } catch (e) { setErr(e instanceof Error ? e.message : 'Hata') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">{restoran ? 'Restoran Düzenle' : 'Yeni Restoran'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">İşletme Adı *</label>
            <input value={form.ad} onChange={e => setForm(f => ({ ...f, ad: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Telefon</label>
            <input value={form.telefon} onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Adres / Konum</label>
            <KonumSecici
              lat={konum.lat}
              lon={konum.lon}
              onChange={(lat, lon) => setKonum({ lat, lon })}
              onAdresBulundu={s => setForm(f => ({ ...f, adres: s.display_name, ilce: s.ilce || f.ilce }))}
              height={260}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Açık Adres</label>
              <input value={form.adres} onChange={e => setForm(f => ({ ...f, adres: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">İlçe</label>
              <input value={form.ilce} onChange={e => setForm(f => ({ ...f, ilce: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
            </div>
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
            <button disabled title="Yakında" className="w-full px-3 py-2 text-sm text-left text-gray-400 opacity-50 cursor-not-allowed flex items-center gap-2">
              <span className="text-gray-400">📄</span> Belgeler <span className="ml-auto text-[10px] font-semibold bg-gray-100 px-1.5 py-0.5 rounded-full">Yakında</span>
            </button>
            <button onClick={() => { setOpen(false); onEdit() }} className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <span className="text-gray-400">✏️</span> Düzenle
            </button>
            <button onClick={() => { setOpen(false); onDelete() }} className="w-full px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-2">
              <span>🗑️</span> Sil
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
type ModalState =
  | { type: 'yeni' }
  | { type: 'edit'; restoran: Restoran }
  | { type: 'panel'; restoran: Restoran }
  | { type: 'calisma'; restoran: Restoran }
  | { type: 'hazirlanma'; restoran: Restoran }
  | null

export default function Restoranlar() {
  const [restoranlar, setRestoranlar] = useState<Restoran[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState<ModalState>(null)
  const [filter, setFilter] = useState<'aktif' | 'silinen'>('aktif')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 10

  const fetchData = useCallback(async () => {
    try { setRestoranlar(await api.restoranlar.list()) }
    catch (err) { setError(err instanceof Error ? err.message : 'Veri yüklenemedi') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleDelete(r: Restoran) {
    if (!confirm(`${r.ad} silinsin mi?`)) return
    try { await api.restoranlar.update(r.id, { aktif: 0 }); await fetchData() }
    catch (err) { alert(err instanceof Error ? err.message : 'Hata') }
  }

  const filtered = restoranlar
    .filter(r => filter === 'aktif' ? r.aktif === 1 : r.aktif === 0)
    .filter(r => !search || r.ad.toLowerCase().includes(search.toLowerCase()) || (r.adres || '').toLowerCase().includes(search.toLowerCase()))

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-600" /></div>
  if (error) return <div className="flex flex-col items-center justify-center py-20 gap-4"><AlertCircle size={32} className="text-red-500" /><p className="text-gray-600">{error}</p><button onClick={fetchData} className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg">Tekrar Dene</button></div>

  return (
    <div>
      {/* Modals */}
      {modal?.type === 'yeni' && <RestoranModal onClose={() => setModal(null)} onSave={fetchData} />}
      {modal?.type === 'edit' && <RestoranModal restoran={modal.restoran} onClose={() => setModal(null)} onSave={fetchData} />}
      {modal?.type === 'panel' && <YonetimPaneliModal restoran={modal.restoran} onClose={() => setModal(null)} onSave={fetchData} />}
      {modal?.type === 'calisma' && <CalismaModal label="Çalışma Tipi" restoran={modal.restoran} onClose={() => setModal(null)} onSave={fetchData} />}
      {modal?.type === 'hazirlanma' && <HazirlanmaModal restoran={modal.restoran} onClose={() => setModal(null)} onSave={fetchData} />}

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Restoran Yönetimi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Toplam {filtered.length} restoran</p>
        </div>
        <div className="flex items-center gap-2">
          <button disabled title="Yakında"
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-400 opacity-50 cursor-not-allowed transition-colors flex items-center gap-1.5">
            <Check size={14} /> Çapraz Ödeme
          </button>
          <button onClick={() => setModal({ type: 'yeni' })}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors font-medium">
            <Plus size={16} /> Yeni Restoran
          </button>
        </div>
      </div>

      {/* Filter + Search bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-1">
          <button onClick={() => { setFilter('aktif'); setPage(1) }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'aktif' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            🏠 Aktif {restoranlar.filter(r => r.aktif).length}
          </button>
          <button onClick={() => { setFilter('silinen'); setPage(1) }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'silinen' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            🗑️ Silinenler {restoranlar.filter(r => !r.aktif).length}
          </button>
        </div>
        <div className="relative ml-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Restoran ara..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="pl-8 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 w-52" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {['İŞLETME ADI', 'TELEFON', 'ADRES', 'ARAÇLAR', ''].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400 text-sm">Restoran bulunamadı</td></tr>
            ) : (
              paged.map(r => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{r.ad}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{r.telefon || '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 max-w-xs truncate">{r.adres || '—'}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 flex-wrap">
                      <button onClick={() => setModal({ type: 'panel', restoran: r })}
                        className="text-xs font-medium px-2 py-1 bg-primary-50 text-primary-600 ring-1 ring-inset ring-primary-100 hover:bg-primary-100 rounded-md transition-colors duration-150 whitespace-nowrap">
                        Yönetim Paneli
                      </button>
                      <button onClick={() => setModal({ type: 'calisma', restoran: r })}
                        className="text-xs font-medium px-2 py-1 bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100 hover:bg-indigo-100 rounded-md transition-colors duration-150 whitespace-nowrap">
                        {r.calisma_tipi || 'Paket Başı'}
                      </button>
                      <button onClick={() => setModal({ type: 'hazirlanma', restoran: r })}
                        className="text-xs font-medium px-2 py-1 bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100 hover:bg-amber-100 rounded-md transition-colors duration-150 whitespace-nowrap">
                        {r.hazirlanma_suresi || 30} dk Hazırlanma
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <RowMenu onEdit={() => setModal({ type: 'edit', restoran: r })} onDelete={() => handleDelete(r)} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <span className="text-sm text-gray-500">
            {filtered.length === 0 ? '0' : `${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, filtered.length)}`} / {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page === 1} className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40">İlk</button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40">‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-full text-sm font-medium ${page === p ? 'bg-primary-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40">›</button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages || totalPages === 0} className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40">Son</button>
          </div>
        </div>
      </div>
    </div>
  )
}
