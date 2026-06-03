import { useEffect, useState, useCallback } from 'react'
import { Settings, Save, Loader2, Percent, Info } from 'lucide-react'
import { api, Ayar } from '../../lib/api'

interface AyarForm { [key: string]: string }

const AYAR_META: Record<string, { label: string; description: string; icon: React.ReactNode; type: string; min?: number; max?: number }> = {
  kdv_orani: {
    label: 'KDV Oranı',
    description: 'Tüm hizmet fiyatlarına uygulanacak KDV yüzdesi. Örn: 20 = %20 KDV.',
    icon: <Percent size={16} />,
    type: 'number',
    min: 0,
    max: 100,
  },
}

export default function AdminAyarlar() {
  const [ayarlar, setAyarlar] = useState<Ayar[]>([])
  const [form, setForm] = useState<AyarForm>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data: Ayar[] = await api.admin.ayarlar.list()
    setAyarlar(data)
    const f: AyarForm = {}
    data.forEach(a => { f[a.anahtar] = a.deger })
    setForm(f)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function saveAyar(anahtar: string) {
    setSaving(anahtar)
    try {
      await api.admin.ayarlar.update(anahtar, form[anahtar] ?? '')
      setSaved(anahtar)
      setTimeout(() => setSaved(null), 2000)
    } catch {}
    setSaving(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={24} className="animate-spin text-blue-600" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sistem Ayarları</h1>
        <p className="text-sm text-gray-500 mt-0.5">Fiyatlandırma ve sistem parametrelerini yönetin</p>
      </div>

      {/* KDV bilgi kartı */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Info size={16} className="text-amber-600 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-700">
          <p className="font-semibold mb-1">KDV Hesaplama</p>
          <p className="text-xs">İş oluşturulduğunda: <strong>Toplam = Baz Fiyat + (Baz Fiyat × KDV%)</strong></p>
          <p className="text-xs mt-0.5">Örnek: ₺500 baz fiyat + %20 KDV = <strong>₺600 toplam</strong></p>
        </div>
      </div>

      <div className="space-y-4">
        {ayarlar.map(ayar => {
          const meta = AYAR_META[ayar.anahtar]
          return (
            <div key={ayar.anahtar} className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  {meta?.icon ?? <Settings size={16} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{meta?.label ?? ayar.anahtar}</p>
                  {(meta?.description || ayar.aciklama) && (
                    <p className="text-xs text-gray-400">{meta?.description ?? ayar.aciklama}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    type={meta?.type ?? 'text'}
                    min={meta?.min}
                    max={meta?.max}
                    step={meta?.type === 'number' ? '0.1' : undefined}
                    value={form[ayar.anahtar] ?? ''}
                    onChange={e => setForm(f => ({ ...f, [ayar.anahtar]: e.target.value }))}
                    className="input-field pr-12"
                  />
                  {ayar.anahtar === 'kdv_orani' && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">%</span>
                  )}
                </div>
                <button
                  onClick={() => saveAyar(ayar.anahtar)}
                  disabled={saving === ayar.anahtar}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    saved === ayar.anahtar
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'btn-primary'
                  }`}
                >
                  {saving === ayar.anahtar ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : saved === ayar.anahtar ? (
                    <><span className="text-emerald-600">✓</span> Kaydedildi</>
                  ) : (
                    <><Save size={14} /> Kaydet</>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {ayarlar.length === 0 && (
        <div className="card py-12 text-center">
          <Settings size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">Ayar bulunamadı</p>
        </div>
      )}
    </div>
  )
}
