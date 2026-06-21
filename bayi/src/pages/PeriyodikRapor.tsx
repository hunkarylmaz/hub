import { useState, useEffect, useCallback, useRef } from 'react'
import { Loader2, AlertCircle, Printer, Filter, ChevronDown, X, Clock, Trash2 } from 'lucide-react'
import { api, Kurye, Restoran, BakiyeHareketi } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

type RaporTipi = 'isletme' | 'kurye'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtTarih(iso: string) {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`
}
function fmtDateTimeLocal(iso: string) {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
function fmtDisplay(iso: string) {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  const months = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']
  return `${p(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}
function fmt(n: number) {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function defaultStart() {
  const d = new Date(); d.setHours(11, 0, 0, 0); d.setDate(d.getDate() - 1)
  return fmtDateTimeLocal(d.toISOString())
}
function defaultEnd() {
  const d = new Date(); d.setHours(5, 0, 0, 0)
  return fmtDateTimeLocal(d.toISOString())
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Tog({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-primary-600' : 'bg-gray-200'}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  )
}

// ─── Tevkifat options (fraction of KDV) ───────────────────────────────────────
const TEVKIFAT_ORANLARI = [
  { label: '2/10', value: 2 },
  { label: '3/10', value: 3 },
  { label: '5/10', value: 5 },
  { label: '7/10', value: 7 },
  { label: '9/10', value: 9 },
]

// ─── Bakiye Hareketi Modal ────────────────────────────────────────────────────
interface BHModalProps {
  entity_type: 'kurye' | 'restoran'
  entity_id: number
  entity_ad: string
  onClose: () => void
}
export function BakiyeHareketiModal({ entity_type, entity_id, entity_ad, onClose }: BHModalProps) {
  const [tur, setTur] = useState<'Aldım' | 'Verdim'>('Aldım')
  const [tutar, setTutar] = useState('')
  const [tarih, setTarih] = useState(fmtDateTimeLocal(new Date().toISOString()))
  const [aciklama, setAciklama] = useState('')
  const [faturayaDahil, setFaturayaDahil] = useState(true)
  const [showGecmis, setShowGecmis] = useState(false)
  const [gecmis, setGecmis] = useState<BakiyeHareketi[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function loadGecmis() {
    setLoading(true)
    try { setGecmis(await api.bakiyeHareketleri.list(entity_type, entity_id)) } catch { /* ignore */ }
    setLoading(false)
  }
  function toggleGecmis() {
    if (!showGecmis) loadGecmis()
    setShowGecmis(v => !v)
  }
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(tutar)
    if (!amount || amount <= 0) { setError('Geçerli tutar girin'); return }
    setSaving(true); setError('')
    try {
      await api.bakiyeHareketleri.create({
        entity_type, entity_id, tur, tutar: amount,
        tarih: tarih ? new Date(tarih).toISOString() : undefined,
        aciklama: aciklama || undefined,
        faturaya_dahil: faturayaDahil ? 1 : 0,
      })
      setTutar(''); setAciklama(''); setTarih(fmtDateTimeLocal(new Date().toISOString()))
      if (showGecmis) loadGecmis()
    } catch (err) { setError(err instanceof Error ? err.message : 'Kaydedilemedi') }
    setSaving(false)
  }
  async function handleDelete(id: number) {
    await api.bakiyeHareketleri.delete(id)
    loadGecmis()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 font-medium">Bakiye Hareketi</p>
            <p className="text-sm font-semibold text-gray-800">
              {entity_type === 'kurye' ? 'Kurye' : 'İşletme'}: {entity_ad}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(['Aldım', 'Verdim'] as const).map(t => (
              <button key={t} type="button" onClick={() => setTur(t)}
                className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                  tur === t
                    ? t === 'Aldım' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-orange-400 bg-orange-50 text-orange-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}>
                {t === 'Aldım' ? '↓ Aldım' : '↑ Verdim'}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">TUTAR (₺)</label>
            <input type="number" min="0.01" step="0.01" value={tutar} onChange={e => setTutar(e.target.value)}
              placeholder="0.00" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">İŞLEM TARİHİ</label>
            <input type="datetime-local" value={tarih} onChange={e => setTarih(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">AÇIKLAMA (OPSİYONEL)</label>
            <input type="text" value={aciklama} onChange={e => setAciklama(e.target.value)}
              placeholder="Örnek: Avans, kısmi ödeme..."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600" />
          </div>
          <div className="flex items-center justify-between py-1">
            <div>
              <span className="text-sm text-gray-700">Faturaya Dahil Et</span>
              <span className="text-xs text-gray-400 ml-2">(seçili tarih aralığındaki rapora yansır)</span>
            </div>
            <Tog checked={faturayaDahil} onChange={setFaturayaDahil} />
          </div>
          {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2"><AlertCircle size={14} />{error}</div>}
          <button type="button" onClick={toggleGecmis}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
            <Clock size={15} /> Geçmiş
          </button>
          {showGecmis && (
            <div className="border border-gray-100 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              {loading ? <div className="flex items-center justify-center py-6"><Loader2 size={20} className="animate-spin text-primary-600" /></div>
                : gecmis.length === 0 ? <div className="py-6 text-center text-sm text-gray-400">Kayıt yok</div>
                : gecmis.map(h => (
                  <div key={h.id} className="flex items-center justify-between px-3 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <div>
                      <span className={`text-xs font-semibold mr-2 ${h.tur === 'Aldım' ? 'text-emerald-600' : 'text-orange-500'}`}>{h.tur}</span>
                      <span className="text-sm font-medium text-gray-800">{fmt(h.tutar)} ₺</span>
                      {h.aciklama && <span className="text-xs text-gray-400 ml-2">{h.aciklama}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{fmtTarih(h.tarih)}</span>
                      <button type="button" onClick={() => handleDelete(h.id)} className="p-1 text-gray-300 hover:text-red-400"><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">İptal</button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-60">
              {saving && <Loader2 size={14} className="animate-spin" />} Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Calculation display row ───────────────────────────────────────────────────
function CalcRow({ label, value, highlight, negative, note }: {
  label: string; value: number; highlight?: boolean; negative?: boolean; note?: string
}) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${highlight ? 'pt-3 border-t-2 border-gray-300' : ''}`}>
      <span className={`text-sm ${highlight ? 'font-bold text-gray-800 text-base' : 'text-gray-600'}`}>
        {label}
        {note && <span className="text-xs text-gray-400 ml-1.5">({note})</span>}
      </span>
      <span className={`font-semibold tabular-nums ${
        highlight ? 'text-xl text-orange-500' :
        negative ? 'text-gray-600' : 'text-gray-800'
      }`}>
        {negative && value > 0 ? '-' : ''}₺{fmt(Math.abs(value))}
      </span>
    </div>
  )
}

// ─── İşletme Raporu ───────────────────────────────────────────────────────────
function IsletmeRaporu() {
  const { bayilik } = useAuth()
  const [restoranlar, setRestoranlar] = useState<Restoran[]>([])
  const [isletmeId, setIsletmeId] = useState<number | ''>('')
  const [baslangic, setBaslangic] = useState(defaultStart)
  const [bitis, setBitis] = useState(defaultEnd)

  const odemeTipleri = ['Kapıda Nakit', 'Kapıda Kart', 'Yemek Kartı', 'Online Ödeme', 'Online Yemek Kartı']
  const [hesaplananOdeme, setHesaplananOdeme] = useState<Record<string, boolean>>({})
  const [gunlukBazli, setGunlukBazli] = useState(true)
  const [posKomisyon, setPosKomisyon] = useState(false)
  const [kdvAktif, setKdvAktif] = useState(true)
  const [kdvOran, setKdvOran] = useState(20)
  const [kdvIslem, setKdvIslem] = useState<'Ekle (+)' | 'Düş (-)'>('Ekle (+)')
  const [tevkifat, setTevkifat] = useState(false)
  const [tevkifatOran, setTevkifatOran] = useState(2) // numerator of x/10

  const [rapor, setRapor] = useState<Awaited<ReturnType<typeof api.raporlar.isletme>> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [bhModal, setBhModal] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => { api.restoranlar.list().then(setRestoranlar).catch(() => {}) }, [])

  async function goruntule() {
    if (!isletmeId) return
    setLoading(true); setError(''); setRapor(null)
    try {
      setRapor(await api.raporlar.isletme({
        isletme_id: Number(isletmeId),
        baslangic: baslangic ? new Date(baslangic).toISOString() : undefined,
        bitis: bitis ? new Date(bitis).toISOString() : undefined,
      }))
    } catch (err) { setError(err instanceof Error ? err.message : 'Rapor alınamadı') }
    setLoading(false)
  }

  // ── Financial calculations ──────────────────────────────────────────────────
  const matrah = rapor?.tasima_toplam || 0
  const posKomisyonTutar = posKomisyon ? matrah * 0.02 : 0
  const netMatrah = matrah - posKomisyonTutar

  // KDV
  const kdvTutar = kdvAktif ? netMatrah * (kdvOran / 100) : 0

  // Tevkifat = X/10 of KDV (restoran pays this directly to tax authority)
  const tevkifatTutar = (tevkifat && kdvAktif) ? kdvTutar * (tevkifatOran / 10) : 0
  const tahsilKdv = kdvTutar - tevkifatTutar  // KDV amount bayi actually receives

  // Hesaplanan ödeme yöntemleri (collected by restoran, offset from what they owe)
  const hesaplananKeys = Object.keys(hesaplananOdeme).filter(k => hesaplananOdeme[k])
  const hesaplananToplam = hesaplananKeys.reduce((acc, key) => {
    const match = Object.entries(rapor?.odeme_gruplari || {}).find(([k]) =>
      key.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(key.toLowerCase().replace('kapıda ', '').replace('online ', ''))
    )
    return acc + (match ? match[1].tutar : 0)
  }, 0)

  let toplamBorc = netMatrah
  if (kdvAktif) {
    if (kdvIslem === 'Ekle (+)') toplamBorc += tahsilKdv
    else toplamBorc -= kdvTutar
  }
  toplamBorc -= hesaplananToplam

  const secilenRestoran = restoranlar.find(r => r.id === isletmeId)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 items-start">
        {/* ── Filter Panel ── */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <div className="flex items-center gap-2 text-primary-600 font-semibold text-sm">
            <Filter size={15} /> Filtreler
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">İŞLETME SEÇİNİZ</label>
            <div className="relative">
              <select value={isletmeId} onChange={e => setIsletmeId(Number(e.target.value) || '')}
                className="w-full appearance-none px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-600/20">
                <option value="">Seçiniz...</option>
                {restoranlar.map(r => <option key={r.id} value={r.id}>{r.ad}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {['BAŞLANGIÇ TARİHİ', 'BİTİŞ TARİHİ'].map((label, i) => (
            <div key={label}>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
              <input type="datetime-local" value={i === 0 ? baslangic : bitis}
                onChange={e => i === 0 ? setBaslangic(e.target.value) : setBitis(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
            </div>
          ))}

          {/* Payment method toggles */}
          <div className="border-t border-gray-100 pt-3 space-y-2.5">
            {odemeTipleri.map(tip => (
              <div key={tip} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{tip}</span>
                <Tog checked={!!hesaplananOdeme[tip]} onChange={v => setHesaplananOdeme(p => ({ ...p, [tip]: v }))} />
              </div>
            ))}
          </div>

          {/* Options */}
          <div className="border-t border-gray-100 pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Günlük Bazlı Gösterim</span>
              <Tog checked={gunlukBazli} onChange={setGunlukBazli} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">POS Komisyon Düş (%2)</span>
              <Tog checked={posKomisyon} onChange={setPosKomisyon} />
            </div>

            {/* KDV */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">KDV</span>
              <Tog checked={kdvAktif} onChange={setKdvAktif} />
            </div>
            {kdvAktif && (
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-20">KDV Oranı</span>
                  <div className="flex items-center gap-1">
                    <input type="number" min="1" max="100" value={kdvOran} onChange={e => setKdvOran(Number(e.target.value) || 20)}
                      className="w-16 px-2 py-1 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-20">İşlem</span>
                  <div className="relative flex-1">
                    <select value={kdvIslem} onChange={e => setKdvIslem(e.target.value as typeof kdvIslem)}
                      className="w-full appearance-none px-2 py-1 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
                      <option>Ekle (+)</option>
                      <option>Düş (-)</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            )}

            {/* Tevkifat */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">KDV Tevkifatı</span>
              <Tog checked={tevkifat} onChange={setTevkifat} />
            </div>
            {tevkifat && kdvAktif && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-20">Oran</span>
                  <div className="relative flex-1">
                    <select value={tevkifatOran}
                      onChange={e => setTevkifatOran(Number(e.target.value))}
                      className="w-full appearance-none px-2 py-1 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
                      {TEVKIFAT_ORANLARI.map(o => (
                        <option key={o.value} value={o.value}>{o.label} (nakliye)</option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  ₺{fmt(kdvTutar)} × {tevkifatOran}/10 = ₺{fmt(tevkifatTutar)} (restoran vergi dairesine öder)
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex gap-2">
              <button onClick={goruntule} disabled={!isletmeId || loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50">
                {loading && <Loader2 size={15} className="animate-spin" />}
                Rapor Görüntüle
              </button>
              <button onClick={() => window.print()} disabled={!rapor}
                className="p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 disabled:opacity-40" title="PDF / Yazdır">
                <Printer size={16} />
              </button>
            </div>
            {secilenRestoran && (
              <button onClick={() => setBhModal(true)}
                className="w-full py-2.5 border border-primary-200 text-primary-600 text-sm font-medium rounded-xl hover:bg-primary-50">
                Bakiye Hareketi
              </button>
            )}
          </div>
          {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2"><AlertCircle size={14} />{error}</div>}
        </div>

        {/* ── Report Output ── */}
        {rapor ? (
          <div ref={printRef} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="bg-primary-600 h-1.5" />
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl">
                  {(bayilik?.ad || 'B').charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{bayilik?.ad}</p>
                  <p className="text-xs text-gray-500">Kurye Taşıma Hizmeti</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold text-primary-600">Periyodik Paket Raporu</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {baslangic ? fmtDisplay(new Date(baslangic).toISOString()) : '—'} –{' '}
                  {bitis ? fmtDisplay(new Date(bitis).toISOString()) : '—'}
                </p>
              </div>
            </div>

            {/* Summary row */}
            <div className="px-6 py-4 border-b border-gray-100 grid grid-cols-3 gap-4 text-sm">
              {[
                ['Firma Adı', rapor.restoran.ad],
                ['Çalışma Şekli', rapor.restoran.calisma_tipi || 'Paket Başı'],
                ['Toplam Paket', `${rapor.toplam_paket} Adet`],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{k}</p>
                  <p className="font-semibold text-primary-600">{v}</p>
                </div>
              ))}
            </div>

            <div className="p-6 space-y-6">
              {/* İşletme Kazanç Kanalları */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">İşletme Kazanç Kanalları</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-gray-500 font-medium">Ödeme Yöntemi</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Paket Sayısı</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Toplam Tutar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(rapor.odeme_gruplari).map(([yontem, data]) => (
                      <tr key={yontem} className="border-b border-gray-100">
                        <td className="py-2 text-gray-700">{yontem}</td>
                        <td className="py-2 text-right text-primary-600 font-medium">{data.sayi} Adet</td>
                        <td className="py-2 text-right text-primary-600 font-medium">₺{fmt(data.tutar)}</td>
                      </tr>
                    ))}
                    {Object.keys(rapor.odeme_gruplari).length === 0 && (
                      <tr><td colSpan={3} className="py-4 text-center text-gray-400 text-xs">Bu tarih aralığında teslim edilen sipariş bulunamadı</td></tr>
                    )}
                    <tr className="border-t-2 border-gray-300">
                      <td className="py-2.5 font-bold text-gray-800">Toplam Gelir</td>
                      <td className="py-2.5 text-right font-bold text-gray-800">{rapor.toplam_paket} Adet</td>
                      <td className="py-2.5 text-right font-bold text-gray-800">₺{fmt(rapor.toplam_gelir)}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 text-gray-700">
                        Paket Taşıma Ücreti
                        {rapor.tasima_aciklama && <span className="text-xs text-gray-400 ml-2">({rapor.tasima_aciklama})</span>}
                      </td>
                      <td className="py-2 text-right text-gray-400">—</td>
                      <td className="py-2 text-right text-primary-600 font-medium">₺{fmt(matrah)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Günlük bazlı */}
              {gunlukBazli && rapor.gunluk.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Günlük Bazlı Rapor</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-gray-500 font-medium">Tarih</th>
                        <th className="text-right py-2 text-gray-500 font-medium">Paket</th>
                        <th className="text-right py-2 text-gray-500 font-medium">Toplam Gelir</th>
                        <th className="text-right py-2 text-gray-500 font-medium">Paket Taşıma</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rapor.gunluk.map(g => (
                        <tr key={g.gun} className="border-b border-gray-50">
                          <td className="py-2 text-gray-700">{fmtTarih(g.gun)}</td>
                          <td className="py-2 text-right text-gray-600">{g.sayi}</td>
                          <td className="py-2 text-right text-primary-600">₺{fmt(g.gelir)}</td>
                          <td className="py-2 text-right text-primary-600">₺{fmt(g.tasima)}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-gray-300">
                        <td className="py-2 font-bold text-gray-800">Toplam</td>
                        <td className="py-2 text-right font-bold text-gray-800">{rapor.toplam_paket}</td>
                        <td className="py-2 text-right font-bold text-gray-800">₺{fmt(rapor.toplam_gelir)}</td>
                        <td className="py-2 text-right font-bold text-gray-800">₺{fmt(matrah)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Hesaplanan ödeme yöntemleri */}
              <div className="text-sm text-gray-600">
                <span className="font-medium">Hesaplanan Ödeme Yöntemleri: </span>
                {hesaplananKeys.length === 0 ? 'Hiçbir ödeme yöntemi hesaplanmaktadır.' : hesaplananKeys.join(', ')}
              </div>

              {/* Calculation breakdown */}
              <div className="border-t border-gray-200 pt-4">
                {posKomisyon && (
                  <CalcRow label="POS Komisyon (%2)" value={posKomisyonTutar} negative />
                )}
                <CalcRow label="Ara Toplam (Taşıma)" value={netMatrah} negative />
                {hesaplananToplam > 0 && (
                  <CalcRow label="Hesaplanan Ödemeler" value={hesaplananToplam} negative />
                )}
                {kdvAktif && (
                  <CalcRow
                    label={`KDV (%${kdvOran})(${kdvIslem === 'Ekle (+)' ? '+' : '-'})`}
                    value={kdvIslem === 'Ekle (+)' ? tahsilKdv : kdvTutar}
                    negative
                  />
                )}
                {tevkifat && kdvAktif && (
                  <div className="py-1 pl-4 border-l-2 border-dashed border-gray-200">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Tevkifat ({tevkifatOran}/10 KDV) — restoran vergi dairesine öder</span>
                      <span>₺{fmt(tevkifatTutar)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Tahsil edilecek KDV</span>
                      <span>₺{fmt(tahsilKdv)}</span>
                    </div>
                  </div>
                )}
                <CalcRow label="Bize Ödemeniz Gereken Tutar" value={toplamBorc} highlight />
              </div>

              {/* Note */}
              <div className="bg-primary-600 text-white text-xs rounded-xl p-4 leading-relaxed">
                Not: Nakit, Kart ve Online Ödeme Yöntemi ile ödemesi yapılmış siparişlerde, sipariş karşılığı
                düzenlenmesi gereken fişler/faturalar, sizin tarafınızdan düzenlenir. İptal paketler hesaplamaya
                dahil değildir.
              </div>

              <div className="flex justify-end">
                <button onClick={() => window.print()}
                  className="flex items-center gap-2 px-5 py-2.5 border border-primary-600 text-primary-600 text-sm font-medium rounded-xl hover:bg-primary-50">
                  <Printer size={15} /> PDF İndir
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200 min-h-[300px]">
            <p className="text-sm text-gray-400">Filtrelerinizi seçip "Rapor Görüntüle" butonuna basın</p>
          </div>
        )}
      </div>

      {bhModal && secilenRestoran && (
        <BakiyeHareketiModal
          entity_type="restoran" entity_id={secilenRestoran.id} entity_ad={secilenRestoran.ad}
          onClose={() => setBhModal(false)}
        />
      )}
    </div>
  )
}

// ─── Kurye Raporu ─────────────────────────────────────────────────────────────
function KuryeRaporu() {
  const { bayilik } = useAuth()
  const [kuryeler, setKuryeler] = useState<Kurye[]>([])
  const [kuryeId, setKuryeId] = useState<number | ''>('')
  const [baslangic, setBaslangic] = useState(defaultStart)
  const [bitis, setBitis] = useState(defaultEnd)
  const [kdvAktif, setKdvAktif] = useState(false)
  const [kdvOran, setKdvOran] = useState(20)
  const [tevkifat, setTevkifat] = useState(false)
  const [tevkifatOran, setTevkifatOran] = useState(2)
  const [gunlukBazli, setGunlukBazli] = useState(false)
  const [bonusDahil, setBonusDahil] = useState(false)

  const [rapor, setRapor] = useState<Awaited<ReturnType<typeof api.raporlar.kurye>> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [bhModal, setBhModal] = useState(false)

  useEffect(() => { api.kuryeler.list().then(setKuryeler).catch(() => {}) }, [])

  const goruntule = useCallback(async () => {
    if (!kuryeId) return
    setLoading(true); setError(''); setRapor(null)
    try {
      setRapor(await api.raporlar.kurye({
        kurye_id: Number(kuryeId),
        baslangic: baslangic ? new Date(baslangic).toISOString() : undefined,
        bitis: bitis ? new Date(bitis).toISOString() : undefined,
      }))
    } catch (err) { setError(err instanceof Error ? err.message : 'Rapor alınamadı') }
    setLoading(false)
  }, [kuryeId, baslangic, bitis])

  // ── Financial calculations ──────────────────────────────────────────────────
  const brutKazanc = rapor?.brut_kazanc || 0
  const aldimToplam = rapor?.aldim_toplam || 0

  // KDV — kurye hakedişinden düşülecek
  const kdvTutar = kdvAktif ? brutKazanc * (kdvOran / 100) : 0

  // Tevkifat = X/10 of KDV
  const tevkifatTutar = (tevkifat && kdvAktif) ? kdvTutar * (tevkifatOran / 10) : 0

  const netOdeme = brutKazanc - aldimToplam - kdvTutar - tevkifatTutar

  const secilenKurye = kuryeler.find(k => k.id === kuryeId)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 items-start">
        {/* ── Filter Panel ── */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <div className="flex items-center gap-2 text-primary-600 font-semibold text-sm">
            <Filter size={15} /> Kurye Raporu Filtreleri
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">KURYE SEÇİNİZ</label>
            <div className="relative">
              <select value={kuryeId} onChange={e => setKuryeId(Number(e.target.value) || '')}
                className="w-full appearance-none px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-600/20">
                <option value="">Seçiniz...</option>
                {kuryeler.map(k => <option key={k.id} value={k.id}>{k.ad}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {['BAŞLANGIÇ TARİHİ', 'BİTİŞ TARİHİ'].map((label, i) => (
            <div key={label}>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
              <input type="datetime-local" value={i === 0 ? baslangic : bitis}
                onChange={e => i === 0 ? setBaslangic(e.target.value) : setBitis(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
            </div>
          ))}

          <div className="border-t border-gray-100 pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">KDV</span>
              <Tog checked={kdvAktif} onChange={setKdvAktif} />
            </div>
            {kdvAktif && (
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-20">KDV Oranı</span>
                  <div className="flex items-center gap-1">
                    <input type="number" min="1" max="100" value={kdvOran} onChange={e => setKdvOran(Number(e.target.value) || 20)}
                      className="w-16 px-2 py-1 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">KDV Tevkifatı</span>
              <Tog checked={tevkifat} onChange={setTevkifat} />
            </div>
            {tevkifat && kdvAktif && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-20">Oran</span>
                  <div className="relative flex-1">
                    <select value={tevkifatOran} onChange={e => setTevkifatOran(Number(e.target.value))}
                      className="w-full appearance-none px-2 py-1 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
                      {TEVKIFAT_ORANLARI.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Gün Bazlı Rapor</span>
              <Tog checked={gunlukBazli} onChange={setGunlukBazli} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Bonus Dahil Et</span>
              <Tog checked={bonusDahil} onChange={setBonusDahil} />
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex gap-2">
              <button onClick={goruntule} disabled={!kuryeId || loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50">
                {loading && <Loader2 size={15} className="animate-spin" />}
                Rapor Görüntüle
              </button>
              <button onClick={() => window.print()} disabled={!rapor}
                className="p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 disabled:opacity-40">
                <Printer size={16} />
              </button>
            </div>
            {secilenKurye && (
              <button onClick={() => setBhModal(true)}
                className="w-full py-2.5 border border-primary-200 text-primary-600 text-sm font-medium rounded-xl hover:bg-primary-50">
                Bakiye Hareketi
              </button>
            )}
          </div>
          {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2"><AlertCircle size={14} />{error}</div>}
        </div>

        {/* ── Report Output ── */}
        {rapor ? (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="bg-primary-600 h-1.5" />
            <div className="p-6 border-b border-gray-100 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl">
                  {(bayilik?.ad || 'B').charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{bayilik?.ad}</p>
                  <p className="text-xs text-gray-500">paket servisi</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold text-primary-600">Kurye Raporu</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {baslangic ? fmtDisplay(new Date(baslangic).toISOString()) : '—'} –{' '}
                  {bitis ? fmtDisplay(new Date(bitis).toISOString()) : '—'}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ['Kurye Adı', rapor.kurye.ad],
                  ['Çalışma Şekli', rapor.kurye.calisma_tipi || 'Paket Başı'],
                  ['Toplam Paket', `${rapor.toplam_paket} Adet`],
                  ['Toplam Ciro', `₺${fmt(rapor.ciro)}`],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{k}</p>
                    <p className="font-semibold text-primary-600">{v}</p>
                  </div>
                ))}
              </div>

              {/* Günlük bazlı */}
              {gunlukBazli && rapor.gunluk.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Günlük Dağılım</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-gray-500 font-medium">Tarih</th>
                        <th className="text-right py-2 text-gray-500 font-medium">Paket</th>
                        <th className="text-right py-2 text-gray-500 font-medium">Kazanç</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rapor.gunluk.map(g => (
                        <tr key={g.gun} className="border-b border-gray-50">
                          <td className="py-2 text-gray-700">{fmtTarih(g.gun)}</td>
                          <td className="py-2 text-right text-primary-600">{g.sayi} Adet</td>
                          <td className="py-2 text-right text-primary-600">₺{fmt(g.kazanc)}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-gray-300">
                        <td className="py-2 font-bold text-gray-800">Toplam</td>
                        <td className="py-2 text-right font-bold text-gray-800">{rapor.toplam_paket} Adet</td>
                        <td className="py-2 text-right font-bold text-gray-800">₺{fmt(brutKazanc)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Calculation breakdown */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between py-1.5 text-sm text-gray-600">
                  <span>
                    Brüt Kazanç
                    {rapor.kazanc_aciklama && <span className="text-xs text-gray-400 ml-2">({rapor.kazanc_aciklama})</span>}
                  </span>
                  <span className="font-semibold text-gray-800">₺{fmt(brutKazanc)}</span>
                </div>
                {aldimToplam > 0 && (
                  <CalcRow label="Alınan Avans / Ödeme" value={aldimToplam} negative />
                )}
                {kdvAktif && (
                  <CalcRow label={`KDV (%${kdvOran}) — kesinti`} value={kdvTutar} negative />
                )}
                {tevkifat && kdvAktif && (
                  <div className="py-1 pl-4 border-l-2 border-dashed border-gray-200">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>KDV Tevkifatı ({tevkifatOran}/10) — ek kesinti</span>
                      <span>₺{fmt(tevkifatTutar)}</span>
                    </div>
                  </div>
                )}
                <CalcRow label="Size Ödeyeceğimiz Tutar" value={Math.max(0, netOdeme)} highlight />
              </div>

              {/* Note */}
              <div className="bg-primary-600 text-white text-xs rounded-xl p-4 leading-relaxed">
                Not: Bu rapor {baslangic ? fmtDisplay(new Date(baslangic).toISOString()) : '—'} –{' '}
                {bitis ? fmtDisplay(new Date(bitis).toISOString()) : '—'} tarihleri arasında
                teslim edilen siparişleri kapsamaktadır. İptal edilen paketler hesaplamaya dahil değildir.
              </div>

              <div className="flex justify-end">
                <button onClick={() => window.print()}
                  className="flex items-center gap-2 px-5 py-2.5 border border-primary-600 text-primary-600 text-sm font-medium rounded-xl hover:bg-primary-50">
                  <Printer size={15} /> PDF İndir
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200 min-h-[300px]">
            <p className="text-sm text-gray-400">Kurye seçip "Rapor Görüntüle" butonuna basın</p>
          </div>
        )}
      </div>

      {bhModal && secilenKurye && (
        <BakiyeHareketiModal
          entity_type="kurye" entity_id={secilenKurye.id} entity_ad={secilenKurye.ad}
          onClose={() => setBhModal(false)}
        />
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Raporlar() {
  const [tab, setTab] = useState<RaporTipi>('isletme')
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Raporlar</h1>
        <p className="text-sm text-gray-500 mt-0.5">Periyodik işletme ve kurye hakedişleri</p>
      </div>
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {([['isletme', 'İşletme Raporu'], ['kurye', 'Kurye Raporu']] as [RaporTipi, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'isletme' && <IsletmeRaporu />}
      {tab === 'kurye' && <KuryeRaporu />}
    </div>
  )
}
