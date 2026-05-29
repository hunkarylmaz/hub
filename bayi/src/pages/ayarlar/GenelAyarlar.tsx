import { useState, useEffect, useCallback } from 'react'
import { Loader2, Save, Building2, Bike, ShoppingBag, AlertTriangle } from 'lucide-react'
import { api, BayiAyarlar } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-[22px] rounded-full transition-colors ${checked ? 'bg-primary-600' : 'bg-gray-200'}`}
    >
      <span className={`block w-[18px] h-[18px] bg-white rounded-full shadow absolute top-[2px] transition-transform ${checked ? 'translate-x-[20px]' : 'translate-x-[2px]'}`} />
    </button>
  )
}

function Slider({ value, min, max, step = 1, unit, onChange }: {
  value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 accent-primary-600"
      />
      <span className="text-sm font-semibold text-primary-600 w-14 text-right">{value}{unit}</span>
    </div>
  )
}

export default function GenelAyarlar() {
  const { bayilik } = useAuth()
  const [ayarlar, setAyarlar] = useState<BayiAyarlar | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const data = await api.ayarlar.get()
      setAyarlar(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function update(patch: Partial<BayiAyarlar>) {
    setAyarlar(prev => prev ? { ...prev, ...patch } : prev)
  }

  async function handleSave(payload: Partial<BayiAyarlar>) {
    setSaving(true); setSuccess(''); setError('')
    try {
      await api.ayarlar.updateGenel(payload)
      setSuccess('Kaydedildi')
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaydetme başarısız')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-primary-600" /></div>
  if (!ayarlar) return <div className="py-10 text-center text-gray-500">Yüklenemedi</div>

  const saatOptions: string[] = []
  for (let h = 0; h < 24; h++) {
    saatOptions.push(`${String(h).padStart(2, '0')}:00`)
    saatOptions.push(`${String(h).padStart(2, '0')}:30`)
  }

  return (
    <div className="space-y-5">
      {success && <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-emerald-700">{success}</div>}
      {error && <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>}

      {/* Firma Bilgileri */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
            <Building2 size={14} className="text-primary-600" />
          </div>
          <h2 className="font-semibold text-gray-800">Firma Bilgileri</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Firma Adı</label>
            <input readOnly value={bayilik?.ad || ''} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Şehir</label>
            <input readOnly value={bayilik?.sehir || ''} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">İlçe</label>
            <input
              value={ayarlar.ilce || ''}
              onChange={e => update({ ilce: e.target.value })}
              placeholder="İlçe adı"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Açılış Saati</label>
            <select
              value={ayarlar.calisma_acilis || '11:00'}
              onChange={e => update({ calisma_acilis: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
            >
              {saatOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Kapanış Saati</label>
            <select
              value={ayarlar.calisma_kapanis || '05:00'}
              onChange={e => update({ calisma_kapanis: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
            >
              {saatOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Enlem (lat)</label>
            <input
              type="number" step="0.000001"
              value={ayarlar.lat ?? ''}
              onChange={e => update({ lat: e.target.value ? Number(e.target.value) : null })}
              placeholder="38.4192"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Boylam (lon)</label>
            <input
              type="number" step="0.000001"
              value={ayarlar.lon ?? ''}
              onChange={e => update({ lon: e.target.value ? Number(e.target.value) : null })}
              placeholder="27.1287"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => handleSave({ ilce: ayarlar.ilce, calisma_acilis: ayarlar.calisma_acilis, calisma_kapanis: ayarlar.calisma_kapanis, lat: ayarlar.lat, lon: ayarlar.lon })}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-60"
          >
            <Save size={14} /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>

      {/* Kurye Ayarları */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
            <Bike size={14} className="text-primary-600" />
          </div>
          <h2 className="font-semibold text-gray-800">Kurye Ayarları</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-800">Sipariş Tutar Görünümü</p>
              <p className="text-xs text-gray-400">Kurye sipariş tutarını görebilir</p>
            </div>
            <Toggle checked={!!ayarlar.siparis_tutar_gorunu} onChange={v => update({ siparis_tutar_gorunu: v ? 1 : 0 })} />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-800">İşletmeye Vardım Butonu</p>
              <p className="text-xs text-gray-400">Kurye işletmeden paket aldığını bildirebilir</p>
            </div>
            <Toggle checked={!!ayarlar.isletmeye_vardim} onChange={v => update({ isletmeye_vardim: v ? 1 : 0 })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Sipariş Onay Modu</label>
            <select
              value={ayarlar.siparis_onay_modu || 'Manuel'}
              onChange={e => update({ siparis_onay_modu: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
            >
              <option value="Manuel">Manuel — Her sipariş manuel onay</option>
              <option value="Otomatik">Otomatik — Sipariş anında onaylanır</option>
              <option value="Randevulu">Randevulu — Belirlenen saatte onaylanır</option>
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500">Bildirim Gecikmesi</label>
              <span className="text-xs text-gray-400">Sipariş bildirimini gecikmeli gönder</span>
            </div>
            <Slider
              value={ayarlar.bildirim_gecikmesi ?? 6}
              min={1} max={30} step={1} unit=" dk"
              onChange={v => update({ bildirim_gecikmesi: v })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Bildirim Mesajı</label>
            <textarea
              value={ayarlar.bildirim_mesaji || ''}
              onChange={e => update({ bildirim_mesaji: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 resize-none"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => handleSave({
              siparis_tutar_gorunu: ayarlar.siparis_tutar_gorunu,
              isletmeye_vardim: ayarlar.isletmeye_vardim,
              siparis_onay_modu: ayarlar.siparis_onay_modu,
              bildirim_gecikmesi: ayarlar.bildirim_gecikmesi,
              bildirim_mesaji: ayarlar.bildirim_mesaji,
            })}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-60"
          >
            <Save size={14} /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>

      {/* Sipariş Ayarları */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
            <ShoppingBag size={14} className="text-primary-600" />
          </div>
          <h2 className="font-semibold text-gray-800">Sipariş Ayarları</h2>
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-gray-800">Geçmiş Kazanç Düzenleme</p>
            <p className="text-xs text-gray-400">Kurye geçmiş ödemelerini görebilir ve düzenleyebilir</p>
          </div>
          <Toggle checked={!!ayarlar.gecmis_kazanc_duzenleme} onChange={v => update({ gecmis_kazanc_duzenleme: v ? 1 : 0 })} />
        </div>
        {!!ayarlar.gecmis_kazanc_duzenleme && (
          <div className="flex items-start gap-2 mt-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
            <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">Bu ayar açık olduğunda kuryeler kendi geçmiş ödemelerini görebilir. Hassas finansal verilerin paylaşılması konusunda dikkatli olun.</p>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => handleSave({ gecmis_kazanc_duzenleme: ayarlar.gecmis_kazanc_duzenleme })}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-60"
          >
            <Save size={14} /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}
