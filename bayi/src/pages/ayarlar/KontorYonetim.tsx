import { useState, useEffect, useCallback } from 'react'
import { Coins, Loader2, CreditCard, ClipboardList, History, Copy, Check, AlertCircle, Building2 } from 'lucide-react'
import { api, BankaHesabi, KontorTalep } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

type Tab = 'yukle' | 'talepler' | 'gecmis'

const MIKTAR_OPTIONS = [500, 1000, 2000, 5000, 10000]
const FIYAT_PER_100 = 10 // ₺ per 100 kontör

function StatusBadge({ durum }: { durum: string }) {
  const map: Record<string, string> = {
    'Beklemede': 'bg-amber-50 text-amber-700 border-amber-200',
    'Onaylandı': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Reddedildi': 'bg-red-50 text-red-700 border-red-200',
    'İptal': 'bg-gray-50 text-gray-500 border-gray-200',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${map[durum] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
      {durum}
    </span>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button onClick={copy} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
    </button>
  )
}

export default function KontorYonetim() {
  const { bayilik } = useAuth()
  const [tab, setTab] = useState<Tab>('yukle')
  const [bankalar, setBankalar] = useState<BankaHesabi[]>([])
  const [talepler, setTalepler] = useState<KontorTalep[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Form state
  const [miktar, setMiktar] = useState(1000)
  const [gonderen, setGonderen] = useState('')
  const [banka, setBanka] = useState('')
  const [notText, setNotText] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [bs, ts] = await Promise.all([
        api.bankaHesaplari.list(),
        api.kontorTalepler.list(),
      ])
      setBankalar(bs)
      setTalepler(ts)
      if (bs.length > 0) setBanka(bs[0].banka_adi)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!gonderen.trim()) { setError('Gönderen adı gerekli'); return }
    setSubmitting(true); setSuccess(''); setError('')
    try {
      const t = await api.kontorTalepler.create({ miktar, gonderen, banka, not_text: notText })
      setTalepler(prev => [t, ...prev])
      setSuccess(`${miktar} kontör talebiniz alındı! Talep No: ${t.talep_no}`)
      setGonderen(''); setNotText('')
      setTab('talepler')
      setTimeout(() => setSuccess(''), 6000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gönderim başarısız')
    } finally { setSubmitting(false) }
  }

  const tutar = (miktar / 100) * FIYAT_PER_100

  const tabs = [
    { key: 'yukle' as Tab, label: 'Kontör Yükle', icon: CreditCard },
    { key: 'talepler' as Tab, label: 'Taleplerim', icon: ClipboardList },
    { key: 'gecmis' as Tab, label: 'İşlem Geçmişi', icon: History },
  ]

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Balance Card */}
      <div className="rounded-xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
              <Coins size={22} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-200">Mevcut Kontör Bakiyesi</p>
              <p className="text-3xl font-bold">{bayilik?.token ?? 0}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-blue-300">Bayilik Kodu</p>
            <p className="font-mono font-semibold text-sm">{bayilik?.bayilik_id}</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-white/10 flex gap-4 text-xs text-blue-200">
          <span>1 Teslimat = 1 Kontör</span>
          <span>•</span>
          <span>{FIYAT_PER_100}₺ / 100 Kontör</span>
        </div>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-emerald-700 flex items-start gap-2">
          <Check size={14} className="mt-0.5 shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 flex items-start gap-2">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <t.icon size={14} />
            {t.label}
            {t.key === 'talepler' && talepler.filter(t => t.durum === 'Beklemede').length > 0 && (
              <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5">
                {talepler.filter(t => t.durum === 'Beklemede').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Kontör Yükle */}
      {tab === 'yukle' && (
        <div className="space-y-4">
          {/* Pricing Card */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Fiyatlandırma</h3>
            <div className="grid grid-cols-3 gap-3">
              {[500, 1000, 2000, 5000, 10000].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMiktar(m)}
                  className={`rounded-xl border p-3 text-center transition-colors ${miktar === m ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className={`text-lg font-bold ${miktar === m ? 'text-primary-600' : 'text-gray-800'}`}>{m.toLocaleString('tr')}</div>
                  <div className="text-xs text-gray-400">kontör</div>
                  <div className={`text-sm font-semibold mt-1 ${miktar === m ? 'text-primary-600' : 'text-gray-600'}`}>{((m / 100) * FIYAT_PER_100).toLocaleString('tr')}₺</div>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
            <h3 className="font-semibold text-gray-800">Ödeme Bildirimi</h3>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
              Ödeme yaptıktan sonra bu formu doldurun. Transferi doğruladıktan sonra kontörleriniz yüklenir.
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Kontör Miktarı</label>
              <select
                value={miktar}
                onChange={e => setMiktar(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
              >
                {MIKTAR_OPTIONS.map(m => (
                  <option key={m} value={m}>{m.toLocaleString('tr')} Kontör — {((m / 100) * FIYAT_PER_100).toLocaleString('tr')}₺</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Gönderen Adı Soyadı *</label>
              <input
                required
                value={gonderen}
                onChange={e => setGonderen(e.target.value)}
                placeholder="Banka transferinde kullanılan isim"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Gönderilen Banka</label>
              <select
                value={banka}
                onChange={e => setBanka(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
              >
                {bankalar.map(b => (
                  <option key={b.id} value={b.banka_adi}>{b.banka_adi}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Not (opsiyonel)</label>
              <input
                value={notText}
                onChange={e => setNotText(e.target.value)}
                placeholder="Transfer notu veya dekont bilgisi"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div>
                <p className="text-sm text-gray-500">Ödenecek Tutar</p>
                <p className="text-xl font-bold text-gray-900">{tutar.toLocaleString('tr')} ₺</p>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-60"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                {submitting ? 'Gönderiliyor...' : 'Talep Oluştur'}
              </button>
            </div>
          </form>

          {/* Bank Accounts */}
          {bankalar.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={15} className="text-primary-600" />
                <h3 className="font-semibold text-gray-800">Banka Hesapları</h3>
              </div>
              <div className="space-y-3">
                {bankalar.map(b => (
                  <div key={b.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-800">{b.banka_adi}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{b.ad_soyad}</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-gray-700 bg-white border border-gray-200 rounded px-2 py-1 flex-1">{b.iban}</code>
                      <CopyButton text={b.iban} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Taleplerim */}
      {tab === 'talepler' && (
        <div className="bg-white rounded-xl border border-gray-100">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-primary-600" /></div>
          ) : talepler.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">Henüz talep oluşturulmadı</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Talep No</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Kontör</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Banka</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Durum</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {talepler.map(t => (
                  <tr key={t.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{t.talep_no}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">{t.miktar.toLocaleString('tr')}</td>
                    <td className="px-4 py-3 text-gray-600">{t.banka || '—'}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge durum={t.durum} /></td>
                    <td className="px-4 py-3 text-right text-xs text-gray-400">
                      {new Date(t.olusturma_tarihi).toLocaleDateString('tr-TR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* İşlem Geçmişi */}
      {tab === 'gecmis' && (
        <div className="bg-white rounded-xl border border-gray-100">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-primary-600" /></div>
          ) : talepler.filter(t => t.durum !== 'Beklemede').length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">Henüz işlem geçmişi yok</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Talep No</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Kontör</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Gönderen</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Durum</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {talepler.filter(t => t.durum !== 'Beklemede').map(t => (
                  <tr key={t.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{t.talep_no}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">{t.miktar.toLocaleString('tr')}</td>
                    <td className="px-4 py-3 text-gray-600">{t.gonderen || '—'}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge durum={t.durum} /></td>
                    <td className="px-4 py-3 text-right text-xs text-gray-400">
                      {new Date(t.olusturma_tarihi).toLocaleDateString('tr-TR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
