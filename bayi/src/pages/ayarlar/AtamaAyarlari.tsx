import { useState, useEffect, useCallback } from 'react'
import { Loader2, Save, Zap, Package, MapPin } from 'lucide-react'
import { api, AtamaAyarlari as AtamaAyarlariType } from '../../lib/api'

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

function SliderRow({ label, desc, value, min, max, step = 1, unit, onChange }: {
  label: string; desc?: string; value: number; min: number; max: number; step?: number; unit: string; onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="text-sm font-medium text-gray-800">{label}</p>
          {desc && <p className="text-xs text-gray-400">{desc}</p>}
        </div>
        <span className="text-sm font-semibold text-primary-600 w-16 text-right">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 accent-primary-600"
      />
      <div className="flex justify-between text-xs text-gray-300 mt-0.5">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  )
}

function CounterInput({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-sm font-medium"
        >−</button>
        <span className="w-8 text-center text-sm font-semibold text-gray-800">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-sm font-medium"
        >+</button>
      </div>
    </div>
  )
}

const defaultAtama: AtamaAyarlariType = {
  id: 0, bayilik_id: 0,
  oto_atama_aktif: 1, ilave_paket: 1,
  kurye_arama_km: 6, isletme_yakinlik_m: 800, teslimat_yakinlik_m: 500,
  atama_bekleme_dk: 0, paket_birlestirme_dk: 30, atamasiz_tekrar_dk: 3,
  max_paket_per_kurye: 4, kurye_secim_algo: 'En Yakın Kurye',
  havuz_aktif: 1, havuz_teslimatci_gizle: 0,
  havuz_mesafe_km: 7, havuz_bekleme_dk: 3, havuz_siparis_adet: 20, havuz_paket_limiti: 15,
}

export default function AtamaAyarlari() {
  const [data, setData] = useState<AtamaAyarlariType>(defaultAtama)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const d = await api.ayarlar.getAtama()
      setData(d)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function update(patch: Partial<AtamaAyarlariType>) {
    setData(prev => ({ ...prev, ...patch }))
  }

  async function handleSave() {
    setSaving(true); setSuccess(''); setError('')
    try {
      const updated = await api.ayarlar.updateAtama(data)
      setData(updated)
      setSuccess('Atama ayarları kaydedildi')
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaydetme başarısız')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-primary-600" /></div>

  return (
    <div className="space-y-5">
      {success && <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-emerald-700">{success}</div>}
      {error && <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Otomatik Atama */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <Zap size={14} className="text-primary-600" />
              </div>
              <h2 className="font-semibold text-gray-800">Otomatik Atama</h2>
            </div>
            <Toggle checked={!!data.oto_atama_aktif} onChange={v => update({ oto_atama_aktif: v ? 1 : 0 })} />
          </div>

          {!!data.oto_atama_aktif && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Kurye Seçim Algoritması</label>
                <select
                  value={data.kurye_secim_algo}
                  onChange={e => update({ kurye_secim_algo: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                >
                  <option value="En Yakın Kurye">En Yakın Kurye</option>
                  <option value="En Az Paketli">En Az Paketli</option>
                  <option value="Round Robin">Round Robin (Sıra ile)</option>
                  <option value="Karma">Karma (Mesafe + Kapasite)</option>
                </select>
              </div>

              <SliderRow
                label="Kurye Arama Yarıçapı"
                desc="Bu mesafe içindeki kuryeler değerlendirilir"
                value={data.kurye_arama_km} min={1} max={30} step={0.5} unit=" km"
                onChange={v => update({ kurye_arama_km: v })}
              />
              <SliderRow
                label="İşletmeye Yakınlık Eşiği"
                desc="Kurye işletmeye bu kadar yakın olmalı"
                value={data.isletme_yakinlik_m} min={100} max={2000} step={50} unit=" m"
                onChange={v => update({ isletme_yakinlik_m: v })}
              />
              <SliderRow
                label="Teslimat Noktası Yakınlık"
                value={data.teslimat_yakinlik_m} min={100} max={2000} step={50} unit=" m"
                onChange={v => update({ teslimat_yakinlik_m: v })}
              />

              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-3">Zamanlama Ayarları</p>
                <div className="space-y-0">
                  <CounterInput label="Atama Bekleme" value={data.atama_bekleme_dk} min={0} max={10} onChange={v => update({ atama_bekleme_dk: v })} />
                  <CounterInput label="Paket Birleştirme (dk)" value={data.paket_birlestirme_dk} min={5} max={60} onChange={v => update({ paket_birlestirme_dk: v })} />
                  <CounterInput label="Atamasız Tekrar (dk)" value={data.atamasiz_tekrar_dk} min={1} max={15} onChange={v => update({ atamasiz_tekrar_dk: v })} />
                  <CounterInput label="Max Paket / Kurye" value={data.max_paket_per_kurye} min={1} max={10} onChange={v => update({ max_paket_per_kurye: v })} />
                </div>
              </div>

              <div className="flex items-center justify-between py-2.5 border-t border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-800">İlave Paket</p>
                  <p className="text-xs text-gray-400">Dağıtımdaki kuryeye ek paket ata</p>
                </div>
                <Toggle checked={!!data.ilave_paket} onChange={v => update({ ilave_paket: v ? 1 : 0 })} />
              </div>
            </div>
          )}
          {!data.oto_atama_aktif && (
            <p className="text-sm text-gray-400 text-center py-4">Otomatik atama devre dışı — manuel kurye seçimi yapılır</p>
          )}
        </div>

        {/* Sipariş Havuzu */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <Package size={14} className="text-primary-600" />
              </div>
              <h2 className="font-semibold text-gray-800">Sipariş Havuzu</h2>
            </div>
            <Toggle checked={!!data.havuz_aktif} onChange={v => update({ havuz_aktif: v ? 1 : 0 })} />
          </div>

          {!!data.havuz_aktif && (
            <div className="space-y-5">
              <SliderRow
                label="Havuz Mesafesi"
                desc="Kuryenin görebileceği siparişler"
                value={data.havuz_mesafe_km} min={1} max={30} step={0.5} unit=" km"
                onChange={v => update({ havuz_mesafe_km: v })}
              />

              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-3">Limitler</p>
                <div className="space-y-0">
                  <CounterInput label="Bekleme Süresi (dk)" value={data.havuz_bekleme_dk} min={1} max={15} onChange={v => update({ havuz_bekleme_dk: v })} />
                  <CounterInput label="Havuz Max Sipariş" value={data.havuz_siparis_adet} min={5} max={50} onChange={v => update({ havuz_siparis_adet: v })} />
                  <CounterInput label="Kurye Paket Limiti" value={data.havuz_paket_limiti} min={1} max={30} onChange={v => update({ havuz_paket_limiti: v })} />
                </div>
              </div>

              <div className="flex items-center justify-between py-2.5 border-t border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-800">Teslimatçıyı Gizle</p>
                  <p className="text-xs text-gray-400">Diğer kuryeler kimin aldığını göremez</p>
                </div>
                <Toggle checked={!!data.havuz_teslimatci_gizle} onChange={v => update({ havuz_teslimatci_gizle: v ? 1 : 0 })} />
              </div>
            </div>
          )}
          {!data.havuz_aktif && (
            <p className="text-sm text-gray-400 text-center py-4">Sipariş havuzu devre dışı</p>
          )}
        </div>
      </div>

      {/* Bölgelendirme */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
            <MapPin size={14} className="text-primary-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Bölgelendirme</h2>
            <p className="text-xs text-gray-400">Hizmet alanı sınırlarını belirleyin</p>
          </div>
        </div>
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl h-32 flex items-center justify-center">
          <p className="text-sm text-gray-400">Harita bölgelendirme — yakında</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-60"
        >
          <Save size={14} /> {saving ? 'Kaydediliyor...' : 'Tüm Ayarları Kaydet'}
        </button>
      </div>
    </div>
  )
}
