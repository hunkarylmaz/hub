import { useEffect, useState, useCallback } from 'react'
import { Save, Loader2, Percent, Package, Info, Check } from 'lucide-react'
import { api, Ayar } from '../../lib/api'

const PAKET_TIPLERI = [
  { key: 'carpan_Zarf',  label: 'Zarf',  emoji: '✉️', desc: 'Zarf, belge' },
  { key: 'carpan_Küçük', label: 'Küçük', emoji: '📦', desc: 'Küçük kutu' },
  { key: 'carpan_Orta',  label: 'Orta',  emoji: '🗃️', desc: 'Orta kutu (baz)' },
  { key: 'carpan_Büyük', label: 'Büyük', emoji: '📫', desc: 'Büyük kutu' },
  { key: 'carpan_Koli',  label: 'Koli',  emoji: '🏗️', desc: 'Koli, hacimli' },
]

export default function AdminAyarlar() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [kdv, setKdv] = useState('')
  const [carpanlar, setCarpanlar] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    const data: Ayar[] = await api.admin.ayarlar.list()
    const map: Record<string, string> = {}
    data.forEach(a => { map[a.anahtar] = a.deger })
    setKdv(map['kdv_orani'] ?? '20')
    const c: Record<string, string> = {}
    PAKET_TIPLERI.forEach(p => { c[p.key] = map[p.key] ?? '1.0' })
    setCarpanlar(c)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function saveKey(key: string, value: string) {
    setSaving(key)
    try {
      await api.admin.ayarlar.update(key, value)
      setSaved(prev => new Set([...prev, key]))
      setTimeout(() => setSaved(prev => { const s = new Set(prev); s.delete(key); return s }), 2000)
    } catch {}
    setSaving(null)
  }

  // Live example price using current multipliers
  const baseFiyat = 50
  const kdvOran = parseFloat(kdv) || 0

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={24} className="animate-spin text-blue-600" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sistem Ayarları</h1>
        <p className="text-sm text-gray-500 mt-0.5">Fiyatlandırma parametrelerini yönetin</p>
      </div>

      {/* Fiyat hesaplama formülü */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-1.5">
          <Info size={13} /> Fiyat Hesaplama Formülü
        </p>
        <code className="text-sm text-blue-700 block">
          Lokasyon Baz Fiyatı × Paket Çarpanı × (1 + KDV%) = Toplam
        </code>
        <p className="text-xs text-blue-600 mt-2">
          Örnek: ₺{baseFiyat} (lokasyon) × 1.4 (Orta) × {kdvOran > 0 ? `(1 + ${kdvOran/100})` : '1'} = <strong>₺{(baseFiyat * 1.4 * (1 + kdvOran/100)).toFixed(2)}</strong>
        </p>
      </div>

      {/* KDV */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Percent size={16} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">KDV Oranı</p>
            <p className="text-xs text-gray-400">Tüm fiyatlara eklenen vergi oranı</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input type="number" min="0" max="100" step="0.1" value={kdv}
              onChange={e => setKdv(e.target.value)}
              className="input-field pr-8" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">%</span>
          </div>
          <button onClick={() => saveKey('kdv_orani', kdv)} disabled={saving === 'kdv_orani'}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 ${
              saved.has('kdv_orani') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'btn-primary'
            }`}>
            {saving === 'kdv_orani' ? <Loader2 size={14} className="animate-spin" />
              : saved.has('kdv_orani') ? <><Check size={14} /> Kaydedildi</>
              : <><Save size={14} /> Kaydet</>}
          </button>
        </div>
      </div>

      {/* Paket boyutu çarpanları */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <Package size={16} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Paket Boyutu Çarpanları</p>
            <p className="text-xs text-gray-400">Lokasyon fiyatına uygulanır — 1.0 = baz fiyat</p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-semibold text-gray-500 border-b border-gray-100">
                <th className="text-left py-2 pr-4">Paket</th>
                <th className="text-left py-2 pr-4">Çarpan</th>
                <th className="text-right py-2 pr-4">Örnek (₺{baseFiyat} baz)</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {PAKET_TIPLERI.map(p => {
                const val = carpanlar[p.key] ?? '1.0'
                const ornekFiyat = (baseFiyat * (parseFloat(val) || 1) * (1 + kdvOran / 100)).toFixed(2)
                const isSaving = saving === p.key
                const isSaved = saved.has(p.key)
                return (
                  <tr key={p.key} className="hover:bg-gray-50">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{p.emoji}</span>
                        <div>
                          <p className="font-semibold text-gray-800">{p.label}</p>
                          <p className="text-xs text-gray-400">{p.desc}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="relative w-24">
                        <input type="number" min="0.1" max="10" step="0.1" value={val}
                          onChange={e => setCarpanlar(c => ({ ...c, [p.key]: e.target.value }))}
                          className="input-field pr-2 text-sm py-1.5" />
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <span className="font-bold text-gray-800">₺{ornekFiyat}</span>
                      {kdvOran > 0 && (
                        <span className="text-xs text-gray-400 block">KDV dahil</span>
                      )}
                    </td>
                    <td className="py-3">
                      <button onClick={() => saveKey(p.key, val)} disabled={isSaving}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isSaved ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        }`}>
                        {isSaving ? <Loader2 size={11} className="animate-spin" />
                          : isSaved ? <><Check size={11} /> Kaydedildi</>
                          : <><Save size={11} /> Kaydet</>}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 bg-gray-50 rounded-xl p-3">
          <p className="text-xs font-semibold text-gray-600 mb-2">Canlı Önizleme (₺{baseFiyat} lokasyon baz fiyatıyla):</p>
          <div className="flex flex-wrap gap-2">
            {PAKET_TIPLERI.map(p => {
              const val = parseFloat(carpanlar[p.key] || '1')
              const fiyat = (baseFiyat * val * (1 + kdvOran / 100)).toFixed(2)
              return (
                <div key={p.key} className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs">
                  <span className="mr-1">{p.emoji}</span>
                  <span className="font-bold text-gray-700">{p.label}</span>
                  <span className="text-gray-400 mx-1">→</span>
                  <span className="font-bold text-blue-700">₺{fiyat}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-400 text-center">
        Değişiklikler kaydedildikten sonra yeni oluşturulan işlere uygulanır.
      </div>
    </div>
  )
}
