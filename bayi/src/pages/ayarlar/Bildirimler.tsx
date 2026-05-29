import { useState, useEffect, useCallback } from 'react'
import { Loader2, Save } from 'lucide-react'
import { api, BayiAyarlar } from '../../lib/api'

export default function Bildirimler() {
  const [ayarlar, setAyarlar] = useState<BayiAyarlar | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    try { setAyarlar(await api.ayarlar.get()) }
    catch (e) { setError(e instanceof Error ? e.message : 'Yüklenemedi') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleSave() {
    if (!ayarlar) return
    setSaving(true); setSuccess(''); setError('')
    try {
      await api.ayarlar.update({ bildirim_email: ayarlar.bildirim_email, bildirim_sms: ayarlar.bildirim_sms })
      setSuccess('Bildirim tercihleri kaydedildi')
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaydetme başarısız')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-primary-600" /></div>
  if (!ayarlar) return null

  const items: { key: keyof BayiAyarlar; label: string; desc: string }[] = [
    { key: 'bildirim_email', label: 'E-posta Bildirimleri', desc: 'Yeni sipariş ve teslimatlarda e-posta al' },
    { key: 'bildirim_sms', label: 'SMS Bildirimleri', desc: 'Kritik durumlarda SMS bildirimi al' },
  ]

  return (
    <div className="max-w-lg bg-white rounded-xl border border-gray-100 p-6 space-y-4">
      <h2 className="font-semibold text-gray-800">Bildirim Tercihleri</h2>

      {success && <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-emerald-700">{success}</div>}
      {error && <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>}

      {items.map(b => (
        <div key={b.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
          <div>
            <p className="text-sm font-medium text-gray-800">{b.label}</p>
            <p className="text-xs text-gray-400">{b.desc}</p>
          </div>
          <button
            onClick={() => setAyarlar(prev => prev ? { ...prev, [b.key]: (prev[b.key] as number) ? 0 : 1 } : prev)}
            className={`relative w-10 h-[22px] rounded-full transition-colors ${ayarlar[b.key] ? 'bg-primary-600' : 'bg-gray-200'}`}
          >
            <span className={`block w-[18px] h-[18px] bg-white rounded-full shadow absolute top-[2px] transition-transform ${ayarlar[b.key] ? 'translate-x-[20px]' : 'translate-x-[2px]'}`} />
          </button>
        </div>
      ))}

      <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-60">
        <Save size={14} /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
      </button>
    </div>
  )
}
