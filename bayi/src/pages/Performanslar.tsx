import { useState, useEffect, useCallback } from 'react'
import { Loader2, AlertCircle, TrendingUp, Award } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '../lib/api'

type Tab = 'kurye' | 'isletme'

function PercentBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-primary-600 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{value}</span>
    </div>
  )
}

export default function Performanslar() {
  const [tab, setTab] = useState<Tab>('kurye')
  const [data, setData] = useState<{
    kurye_perf: { id: number; ad: string; durum: string; toplam_teslimat: number; gunluk_teslimat: number; toplam: number; basarili: number; ort_sure: number | null }[]
    isletme_perf: { ad: string; toplam: number; teslim: number; ciro: number }[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    try {
      setData(await api.performans.get())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veri yüklenemedi')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-600" /></div>
  if (error) return <div className="flex flex-col items-center justify-center py-20 gap-4"><AlertCircle size={32} className="text-red-500" /><p className="text-gray-600">{error}</p><button onClick={fetchData} className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg">Tekrar Dene</button></div>

  const maxTeslimat = Math.max(...(data?.kurye_perf.map(k => k.toplam_teslimat) || [1]))
  const maxCiro = Math.max(...(data?.isletme_perf.map(i => i.ciro) || [1]))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Performanslar</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kurye ve işletme performans analizleri</p>
      </div>

      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {[{ key: 'kurye' as Tab, label: 'Kurye Performans' }, { key: 'isletme' as Tab, label: 'İşletme Performans' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'kurye' && (
        <div className="grid grid-cols-3 gap-4">
          {data?.kurye_perf.map((k, i) => {
            const basariOrani = k.toplam > 0 ? Math.round((k.basarili / k.toplam) * 100) : null
            return (
              <div key={k.id} className="card p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm">
                    {k.ad.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-sm">{k.ad}</p>
                    <p className="text-xs text-gray-400">{k.durum}</p>
                  </div>
                  {i === 0 && <Award size={18} className="text-amber-500" />}
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Toplam Teslimat</span>
                      <span className="font-semibold text-gray-800">{k.toplam_teslimat}</span>
                    </div>
                    <PercentBar value={k.toplam_teslimat} max={maxTeslimat} />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Bugün</span>
                      <span className="font-semibold text-gray-800">{k.gunluk_teslimat}</span>
                    </div>
                    <PercentBar value={k.gunluk_teslimat} max={15} />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-500">Başarı Oranı</span>
                    <span className={`text-sm font-bold ${basariOrani === null ? 'text-gray-400' : basariOrani >= 80 ? 'text-emerald-600' : basariOrani >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                      {basariOrani === null ? '—' : `${basariOrani}%`}
                    </span>
                  </div>
                  {k.ort_sure !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Ort. Süre</span>
                      <span className="text-sm font-bold text-gray-800">{Math.round(k.ort_sure)} dk</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'isletme' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            {data?.isletme_perf.map((i, idx) => {
              const teslimOrani = i.toplam > 0 ? Math.round((i.teslim / i.toplam) * 100) : 0
              return (
                <div key={idx} className="card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">{i.ad}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${teslimOrani >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {teslimOrani}% teslim
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-gray-800">{i.toplam}</p>
                      <p className="text-xs text-gray-400">Toplam</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-emerald-600">{i.teslim}</p>
                      <p className="text-xs text-gray-400">Teslim</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-primary-600">{i.ciro.toFixed(0)}</p>
                      <p className="text-xs text-gray-400">Ciro ₺</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <PercentBar value={i.ciro} max={maxCiro} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-primary-600" />
              <h3 className="text-sm font-semibold text-gray-700">Ciro Karşılaştırma</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.isletme_perf.map(i => ({ name: i.ad.split(' ')[0], ciro: Math.round(i.ciro), siparis: i.toplam }))} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} angle={-10} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: 12 }} formatter={(v: number, n: string) => [n === 'ciro' ? `${v} ₺` : v, n === 'ciro' ? 'Ciro' : 'Sipariş']} />
                  <Bar dataKey="ciro" fill="#2563EB" radius={[4,4,0,0]} name="ciro" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
