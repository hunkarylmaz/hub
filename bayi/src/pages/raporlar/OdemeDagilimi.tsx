import { useState, useEffect, useCallback } from 'react'
import { Loader2, CreditCard } from 'lucide-react'
import { api, OdemeGrubu } from '../../lib/api'

function defaultStart() {
  const d = new Date(); d.setDate(d.getDate() - 30); d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 16)
}
function defaultEnd() {
  const d = new Date(); d.setHours(23, 59, 0, 0)
  return d.toISOString().slice(0, 16)
}
function fmt(n: number) { return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

const COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  'Nakit':       { bg: 'bg-emerald-50',  text: 'text-emerald-700', bar: 'bg-emerald-500' },
  'Kredi Kartı': { bg: 'bg-blue-50',     text: 'text-blue-700',    bar: 'bg-blue-500' },
  'Yemek Kartı': { bg: 'bg-amber-50',    text: 'text-amber-700',   bar: 'bg-amber-500' },
  'Online':      { bg: 'bg-purple-50',   text: 'text-purple-700',  bar: 'bg-purple-500' },
  'Diğer':       { bg: 'bg-gray-50',     text: 'text-gray-600',    bar: 'bg-gray-400' },
}

export default function OdemeDagilimi() {
  const [data, setData] = useState<{
    gruplari: Record<string, OdemeGrubu>
    toplam_sayi: number
    toplam_tutar: number
    kuryeler: { id: number; ad: string; gruplari: Record<string, OdemeGrubu> }[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [baslangic, setBaslangic] = useState(defaultStart)
  const [bitis, setBitis] = useState(defaultEnd)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try { setData(await api.raporlar.odemeDagilimi({ baslangic, bitis })) }
    finally { setLoading(false) }
  }, [baslangic, bitis])

  useEffect(() => { fetchData() }, [fetchData])

  const gruplari = data?.gruplari || {}
  const toplam = data?.toplam_tutar || 1

  return (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div className="flex items-center gap-2 mr-2">
          <CreditCard size={14} className="text-primary-600" />
          <span className="text-sm font-semibold text-gray-800">Ödeme Dağılımı</span>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Başlangıç</label>
          <input type="datetime-local" value={baslangic} onChange={e => setBaslangic(e.target.value)}
            className="px-2 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Bitiş</label>
          <input type="datetime-local" value={bitis} onChange={e => setBitis(e.target.value)}
            className="px-2 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none" />
        </div>
        <button onClick={fetchData} className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">Filtrele</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-primary-600" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Pie-style breakdown */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Ödeme Yöntemine Göre Dağılım</h3>
            <div className="space-y-3">
              {Object.entries(gruplari).map(([key, v]) => {
                const pct = toplam > 0 ? (v.tutar / toplam) * 100 : 0
                const c = COLORS[key] || COLORS['Diğer']
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${c.text}`}>{key}</span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-800">₺{fmt(v.tutar)}</span>
                        <span className="text-xs text-gray-400 ml-2">{v.sayi} sipariş</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 text-right mt-0.5">%{pct.toFixed(1)}</p>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
              <span className="text-gray-500">Toplam</span>
              <div className="text-right">
                <span className="font-bold text-gray-800">₺{fmt(data?.toplam_tutar || 0)}</span>
                <span className="text-xs text-gray-400 ml-2">{data?.toplam_sayi} sipariş</span>
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="space-y-3">
            {Object.entries(gruplari).map(([key, v]) => {
              const c = COLORS[key] || COLORS['Diğer']
              const pct = toplam > 0 ? (v.tutar / toplam) * 100 : 0
              return (
                <div key={key} className={`rounded-xl border p-4 ${c.bg} border-opacity-50`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-xs font-semibold ${c.text} mb-0.5`}>{key}</p>
                      <p className="text-2xl font-bold text-gray-900">₺{fmt(v.tutar)}</p>
                      <p className="text-xs text-gray-500">{v.sayi} sipariş · %{pct.toFixed(1)}</p>
                    </div>
                    <div className={`text-3xl font-black opacity-10 ${c.text}`}>₺</div>
                  </div>
                </div>
              )
            })}
            {Object.keys(gruplari).length === 0 && (
              <div className="py-10 text-center text-sm text-gray-400 bg-white rounded-xl border border-gray-100">Bu dönem için veri bulunamadı</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
