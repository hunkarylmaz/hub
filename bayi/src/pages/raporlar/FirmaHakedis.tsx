import { useState, useEffect, useCallback } from 'react'
import { Loader2, Building2 } from 'lucide-react'
import { api } from '../../lib/api'

function defaultStart() {
  const d = new Date(); d.setDate(d.getDate() - 7); d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 16)
}
function defaultEnd() {
  const d = new Date(); d.setHours(23, 59, 0, 0)
  return d.toISOString().slice(0, 16)
}
function fmt(n: number) { return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

type FirmaData = {
  paket_sayisi: number
  tasima_ucretleri: number
  kurye_hakedisleri: number
  kazanc: number
  ort_paket_tasima: number
  ort_kurye_hakedis: number
  gunluk: { gun: string; paket: number; tasima: number; hakedis: number; kazanc: number }[]
}

export default function FirmaHakedis() {
  const [data, setData] = useState<FirmaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [baslangic, setBaslangic] = useState(defaultStart)
  const [bitis, setBitis] = useState(defaultEnd)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try { setData(await api.raporlar.firma({ baslangic, bitis })) }
    finally { setLoading(false) }
  }, [baslangic, bitis])

  useEffect(() => { fetchData() }, [fetchData])

  const gunluk = data?.gunluk || []
  const maxTasima = Math.max(...gunluk.map(g => g.tasima), 1)

  return (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div className="flex items-center gap-2 mr-2">
          <Building2 size={14} className="text-primary-600" />
          <span className="text-sm font-semibold text-gray-800">Firma Hakediş</span>
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
        <>
          {/* Summary table */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
            <h3 className="font-semibold text-gray-800 mb-4">Detaylı Hakediş Raporu</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Paket Sayısı', 'Taşıma Ücretleri', 'Kurye Hakediş', 'Ort. Paket Taşıma', 'Ort. Kurye Hakediş', 'Kazanç'].map(h => (
                      <th key={h} className="text-center pb-3 text-xs font-medium text-gray-500 px-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="text-center py-4 text-xl font-bold text-primary-600">{data?.paket_sayisi}</td>
                    <td className="text-center py-4 text-base font-semibold text-emerald-600">₺{fmt(data?.tasima_ucretleri || 0)}</td>
                    <td className="text-center py-4 text-base font-semibold text-red-500">₺{fmt(data?.kurye_hakedisleri || 0)}</td>
                    <td className="text-center py-4 text-base font-semibold text-gray-700">₺{fmt(data?.ort_paket_tasima || 0)}</td>
                    <td className="text-center py-4 text-base font-semibold text-gray-700">₺{fmt(data?.ort_kurye_hakedis || 0)}</td>
                    <td className="text-center py-4 text-base font-bold text-emerald-600">₺{fmt(data?.kazanc || 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Firma Hakediş Grafiği</h3>
            {/* Legend */}
            <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
              {[
                { color: 'bg-blue-400', label: 'Paket Sayısı' },
                { color: 'bg-emerald-400', label: 'Kazanç' },
                { color: 'bg-green-300', label: 'Taşıma Ücreti' },
                { color: 'bg-amber-400', label: 'Kurye Gideri' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-full ${l.color}`} />
                  <span>{l.label}</span>
                </div>
              ))}
            </div>
            {gunluk.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">Grafik verisi bulunamadı</div>
            ) : (
              <div className="overflow-x-auto">
                <div className="flex items-end gap-3 min-w-max pb-2" style={{ minHeight: 160 }}>
                  {gunluk.map((g, i) => {
                    const h = maxTasima > 0 ? (g.tasima / maxTasima) * 120 : 4
                    const hK = maxTasima > 0 ? (g.kazanc / maxTasima) * 120 : 4
                    const hH = maxTasima > 0 ? (g.hakedis / maxTasima) * 120 : 4
                    return (
                      <div key={i} className="flex flex-col items-center gap-1 group">
                        <div className="flex items-end gap-0.5">
                          <div className="w-4 bg-emerald-400 rounded-t" style={{ height: Math.max(4, hK) }} title={`Kazanç: ₺${fmt(g.kazanc)}`} />
                          <div className="w-4 bg-green-300 rounded-t" style={{ height: Math.max(4, h) }} title={`Taşıma: ₺${fmt(g.tasima)}`} />
                          <div className="w-4 bg-amber-400 rounded-t" style={{ height: Math.max(4, hH) }} title={`Hakediş: ₺${fmt(g.hakedis)}`} />
                        </div>
                        <p className="text-xs text-gray-400 whitespace-nowrap">{g.gun.slice(5)}</p>
                        <div className="hidden group-hover:block absolute -translate-y-28 bg-gray-800 text-white text-xs rounded p-1.5 whitespace-nowrap z-10">
                          {g.gun}: {g.paket} paket, ₺{fmt(g.kazanc)} kazanç
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Günlük table */}
            {gunluk.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-100">
                      <th className="text-left py-2 pr-4">Tarih</th>
                      <th className="text-right py-2 px-3">Paket</th>
                      <th className="text-right py-2 px-3">Taşıma</th>
                      <th className="text-right py-2 px-3">Kurye Gider</th>
                      <th className="text-right py-2 px-3">Kazanç</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gunluk.map((g, i) => (
                      <tr key={i} className="border-b border-gray-100 last:border-0">
                        <td className="py-2 pr-4 text-gray-600">{g.gun}</td>
                        <td className="py-2 px-3 text-right font-medium text-primary-600">{g.paket}</td>
                        <td className="py-2 px-3 text-right text-emerald-600">₺{fmt(g.tasima)}</td>
                        <td className="py-2 px-3 text-right text-red-500">₺{fmt(g.hakedis)}</td>
                        <td className="py-2 px-3 text-right font-semibold text-gray-800">₺{fmt(g.kazanc)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
