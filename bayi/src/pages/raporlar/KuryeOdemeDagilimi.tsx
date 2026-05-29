import { useState, useEffect, useCallback } from 'react'
import { Loader2, DollarSign } from 'lucide-react'
import { api, OdemeGrubu } from '../../lib/api'

function defaultStart() {
  const d = new Date(); d.setDate(d.getDate() - 7); d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 16)
}
function defaultEnd() {
  const d = new Date(); d.setHours(23, 59, 0, 0)
  return d.toISOString().slice(0, 16)
}
function fmt(n: number) { return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

const ODEME_COLORS: Record<string, string> = {
  'Nakit': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Kredi Kartı': 'bg-blue-50 text-blue-700 border-blue-200',
  'Yemek Kartı': 'bg-amber-50 text-amber-700 border-amber-200',
  'Online': 'bg-purple-50 text-purple-700 border-purple-200',
  'Diğer': 'bg-gray-50 text-gray-600 border-gray-200',
}

export default function KuryeOdemeDagilimi() {
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

  const kuryeler = data?.kuryeler || []
  const gruplari = data?.gruplari || {}
  const allKeys = Object.keys(gruplari)

  return (
    <div>
      {/* Filter row */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div className="flex items-center gap-2 mr-2">
          <DollarSign size={14} className="text-primary-600" />
          <span className="text-sm font-semibold text-gray-800">Kurye Ödeme Dağılımı</span>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Başlangıç</label>
          <input type="datetime-local" value={baslangic} onChange={e => setBaslangic(e.target.value)}
            className="px-2 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Bitiş</label>
          <input type="datetime-local" value={bitis} onChange={e => setBitis(e.target.value)}
            className="px-2 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
        </div>
        <button onClick={fetchData} className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">Filtrele</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-primary-600" /></div>
      ) : (
        <>
          {/* Overall payment breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {allKeys.map(k => (
              <div key={k} className={`rounded-xl border p-4 ${ODEME_COLORS[k] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                <p className="text-xs font-medium mb-1">{k}</p>
                <p className="text-xl font-bold">₺{fmt(gruplari[k].tutar)}</p>
                <p className="text-xs opacity-70">{gruplari[k].sayi} sipariş</p>
              </div>
            ))}
          </div>

          {/* Per-courier breakdown */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
            {kuryeler.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">Bu dönem için kurye verisi bulunamadı</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Kurye</th>
                    {allKeys.map(k => (
                      <th key={k} className="text-right px-4 py-3 text-xs font-medium text-gray-500">{k}</th>
                    ))}
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {kuryeler.map(k => {
                    const total = Object.values(k.gruplari).reduce((a, v) => a + v.tutar, 0)
                    return (
                      <tr key={k.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/30">
                        <td className="px-4 py-3 font-medium text-gray-800">{k.ad}</td>
                        {allKeys.map(key => (
                          <td key={key} className="px-4 py-3 text-right text-gray-700">
                            {k.gruplari[key] ? (
                              <div>
                                <p className="font-medium">₺{fmt(k.gruplari[key].tutar)}</p>
                                <p className="text-xs text-gray-400">{k.gruplari[key].sayi} adet</p>
                              </div>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right font-bold text-gray-800">₺{fmt(total)}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="border-t border-gray-200 bg-gray-50/50">
                  <tr>
                    <td className="px-4 py-3 text-xs font-bold text-gray-600">TOPLAM</td>
                    {allKeys.map(k => (
                      <td key={k} className="px-4 py-3 text-right text-xs font-bold text-gray-700">
                        ₺{fmt(gruplari[k].tutar)}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right text-xs font-bold text-primary-600">₺{fmt(data?.toplam_tutar || 0)}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
