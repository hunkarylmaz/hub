import { useState, useEffect, useCallback } from 'react'
import { Loader2, Save } from 'lucide-react'
import { api, BayiAyarlar } from '../../lib/api'

export default function BonusAyarlari() {
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
      await api.ayarlar.update({ bonus_aktif: ayarlar.bonus_aktif, bonus_miktar: ayarlar.bonus_miktar })
      setSuccess('Bonus ayarları kaydedildi')
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaydetme başarısız')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-primary-600" /></div>
  if (!ayarlar) return null

  return (
    <div className="max-w-lg bg-white rounded-xl border border-gray-100 p-6 space-y-5">
      <h2 className="font-semibold text-gray-800">Bonus Ayarları</h2>

      {success && <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-emerald-700">{success}</div>}
      {error && <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>}

      <div className="flex items-center justify-between py-3 border-b border-gray-100">
        <div>
          <p className="text-sm font-medium text-gray-800">Bonus Sistemi</p>
          <p className="text-xs text-gray-400">Kuryeler için bonus/prim sistemi</p>
        </div>
        <button
          onClick={() => setAyarlar(prev => prev ? { ...prev, bonus_aktif: prev.bonus_aktif ? 0 : 1 } : prev)}
          className={`w-10 h-[22px] rounded-full transition-colors relative ${ayarlar.bonus_aktif ? 'bg-primary-600' : 'bg-gray-200'}`}
        >
          <span className={`block w-[18px] h-[18px] bg-white rounded-full shadow absolute top-[2px] transition-transform ${ayarlar.bonus_aktif ? 'translate-x-[20px]' : 'translate-x-[2px]'}`} />
        </button>
      </div>

      {!!ayarlar.bonus_aktif ? (
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

      <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-60">
        <Save size={14} /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
      </button>
    </div>
  )
}
