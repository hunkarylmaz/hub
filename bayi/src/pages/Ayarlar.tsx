import { useState, useEffect, useCallback } from 'react'
import { Loader2, AlertCircle, Save, Coins } from 'lucide-react'
import { api, BayiAyarlar } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

type Tab = 'genel' | 'atama' | 'bonus' | 'bildirimler' | 'kontor'

export default function Ayarlar() {
  const { bayilik } = useAuth()
  const [tab, setTab] = useState<Tab>('genel')
  const [ayarlar, setAyarlar] = useState<BayiAyarlar | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchData = useCallback(async () => {
    try {
      setAyarlar(await api.ayarlar.get())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veri yüklenemedi')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleSave(updates: Partial<BayiAyarlar>) {
    setSaving(true)
    setSuccess('')
    try {
      const updated = await api.ayarlar.update(updates)
      setAyarlar(prev => prev ? { ...prev, ...updated } : updated)
      setSuccess('Ayarlar kaydedildi')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydetme başarısız')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-600" /></div>
  if (error && !ayarlar) return <div className="flex flex-col items-center justify-center py-20 gap-4"><AlertCircle size={32} className="text-red-500" /><p className="text-gray-600">{error}</p><button onClick={fetchData} className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg">Tekrar Dene</button></div>

  const tabs: { key: Tab; label: string }[] = [
    { key: 'genel', label: 'Genel Ayar' },
    { key: 'atama', label: 'Atama Ayarları' },
    { key: 'bonus', label: 'Bonus Ayarları' },
    { key: 'bildirimler', label: 'Bildirimler' },
    { key: 'kontor', label: 'Kontör Yönetim' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Ayarlar</h1>
        <p className="text-sm text-gray-500 mt-0.5">Bayi panel ayarları ve konfigürasyonlar</p>
      </div>

      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {success && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-emerald-700">{success}</div>}
      {error && ayarlar && <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>}

      {tab === 'genel' && ayarlar?.bayilik && (
        <div className="max-w-lg bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Bayilik Bilgileri</h2>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Firma Adı</label>
            <input readOnly value={ayarlar.bayilik.ad} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bayilik Kodu</label>
              <input readOnly value={ayarlar.bayilik.bayilik_id} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Şehir</label>
              <input readOnly value={ayarlar.bayilik.sehir} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Durum</label>
            <input readOnly value={ayarlar.bayilik.durum} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500" />
          </div>
        </div>
      )}

      {tab === 'atama' && ayarlar && (
        <div className="max-w-lg bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-800">Kurye Atama Ayarları</h2>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Atama Modu</label>
            <div className="flex gap-3">
              {['Otomatik', 'Manuel'].map(m => (
                <label key={m} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border cursor-pointer transition-colors ${ayarlar.atama_modu === m ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  <input type="radio" className="sr-only" checked={ayarlar.atama_modu === m} onChange={() => setAyarlar(prev => prev ? { ...prev, atama_modu: m } : prev)} />
                  <span className="text-sm font-medium">{m}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {ayarlar.atama_modu === 'Otomatik' ? 'Müsait kuryeye otomatik olarak atanır' : 'Her sipariş için manuel kurye seçimi yapılır'}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Kurye Başına Max Sipariş</label>
            <input
              type="number" min={1} max={10}
              value={ayarlar.max_siparis_per_kurye}
              onChange={e => setAyarlar(prev => prev ? { ...prev, max_siparis_per_kurye: Number(e.target.value) } : prev)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
            />
          </div>
          <button onClick={() => handleSave({ atama_modu: ayarlar.atama_modu, max_siparis_per_kurye: ayarlar.max_siparis_per_kurye })} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-60">
            <Save size={15} /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      )}

      {tab === 'bonus' && ayarlar && (
        <div className="max-w-lg bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-800">Bonus Ayarları</h2>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-800">Bonus Sistemi</p>
              <p className="text-xs text-gray-400">Kuryeler için bonus/prim sistemi</p>
            </div>
            <button
              onClick={() => setAyarlar(prev => prev ? { ...prev, bonus_aktif: prev.bonus_aktif ? 0 : 1 } : prev)}
              className={`w-11 h-6 rounded-full transition-colors ${ayarlar.bonus_aktif ? 'bg-primary-600' : 'bg-gray-200'}`}
            >
              <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${ayarlar.bonus_aktif ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          {ayarlar.bonus_aktif ? (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bonus Miktarı (₺ / teslimat)</label>
              <input
                type="number" min={0} step={0.5}
                value={ayarlar.bonus_miktar}
                onChange={e => setAyarlar(prev => prev ? { ...prev, bonus_miktar: Number(e.target.value) } : prev)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
              />
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Bonus sistemi devre dışı</p>
          )}
          <button onClick={() => handleSave({ bonus_aktif: ayarlar.bonus_aktif, bonus_miktar: ayarlar.bonus_miktar })} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-60">
            <Save size={15} /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      )}

      {tab === 'bildirimler' && ayarlar && (
        <div className="max-w-lg bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Bildirim Tercihleri</h2>
          {[
            { key: 'bildirim_email' as keyof BayiAyarlar, label: 'E-posta Bildirimleri', desc: 'Yeni sipariş ve teslimatlarda e-posta al' },
            { key: 'bildirim_sms' as keyof BayiAyarlar, label: 'SMS Bildirimleri', desc: 'Kritik durumlarda SMS bildirimi al' },
          ].map(b => (
            <div key={b.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800">{b.label}</p>
                <p className="text-xs text-gray-400">{b.desc}</p>
              </div>
              <button
                onClick={() => setAyarlar(prev => prev ? { ...prev, [b.key]: (prev[b.key] as number) ? 0 : 1 } : prev)}
                className={`w-11 h-6 rounded-full transition-colors ${ayarlar[b.key] ? 'bg-primary-600' : 'bg-gray-200'}`}
              >
                <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${ayarlar[b.key] ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
          <button onClick={() => handleSave({ bildirim_email: ayarlar.bildirim_email, bildirim_sms: ayarlar.bildirim_sms })} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-60">
            <Save size={15} /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      )}

      {tab === 'kontor' && (
        <div className="max-w-lg space-y-4">
          <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Coins size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-200">Mevcut Kontör Bakiyesi</p>
                <p className="text-3xl font-bold">{bayilik?.token ?? 0}</p>
              </div>
            </div>
            <p className="text-xs text-blue-200">Her başarılı teslimatta 1 kontör düşülür</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Kontör Bilgileri</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span>Kullanım Kuralı</span>
                <span className="font-medium">1 Teslimat = 1 Kontör</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span>Kontör Yükleme</span>
                <span className="font-medium">B2B Admin Panelinden</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Bayilik Kodu</span>
                <span className="font-medium font-mono">{bayilik?.bayilik_id}</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Kontör yüklemesi için B2B yöneticisi ile iletişime geçin.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
