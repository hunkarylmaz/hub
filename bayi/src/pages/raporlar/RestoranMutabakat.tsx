import { useState, useEffect, useCallback } from 'react'
import { Loader2, Store, CheckCircle2, TrendingDown, TrendingUp } from 'lucide-react'
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

type RestoranMutabakatRow = {
  id: number; ad: string; calisma_tipi: string
  paket_sayisi: number; nakit: number; kredi_karti: number; yemek_karti: number; online: number
  toplam_satis: number; tasima_ucreti: number; alinan: number; verilen: number; net_fark: number
}

export default function RestoranMutabakat() {
  const [data, setData] = useState<{ restoranlar: RestoranMutabakatRow[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [baslangic, setBaslangic] = useState(defaultStart)
  const [bitis, setBitis] = useState(defaultEnd)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try { setData(await api.mutabakat.restoranlar({ baslangic, bitis })) }
    finally { setLoading(false) }
  }, [baslangic, bitis])

  useEffect(() => { fetchData() }, [fetchData])

  const restoranlar = data?.restoranlar || []
  const toplam_tasima = restoranlar.reduce((a, r) => a + r.tasima_ucreti, 0)
  const toplam_alinan = restoranlar.reduce((a, r) => a + r.alinan, 0)
  const toplam_fark = restoranlar.reduce((a, r) => a + r.net_fark, 0)

  return (
    <div>
      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div className="flex items-center gap-2 mr-2">
          <Store size={14} className="text-primary-600" />
          <span className="text-sm font-semibold text-gray-800">Restoran Mutabakatı</span>
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

      {/* Summary */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {[
            { label: 'Toplam Restoran', value: String(restoranlar.length), color: 'text-gray-800' },
            { label: 'Toplam Taşıma Ücreti', value: '₺' + fmt(toplam_tasima), color: 'text-primary-600' },
            { label: 'Toplam Tahsil Edilen', value: '₺' + fmt(toplam_alinan), color: 'text-emerald-600' },
            { label: 'Toplam Kalan', value: (toplam_fark >= 0 ? '' : '-') + '₺' + fmt(Math.abs(toplam_fark)), color: toplam_fark > 0.01 ? 'text-red-500' : toplam_fark < -0.01 ? 'text-amber-500' : 'text-emerald-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-primary-600" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Restoran</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Paket</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Nakit</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Kart</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Yemek Kartı</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Online</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Toplam Satış</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Kurye Hizmeti</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Tahsil</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Durum</th>
              </tr>
            </thead>
            <tbody>
              {restoranlar.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-gray-400 text-sm">Bu dönem için veri bulunamadı</td></tr>
              ) : (
                restoranlar.map(r => {
                  const farkVar = Math.abs(r.net_fark) > 0.01
                  return (
                    <tr key={r.id} className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/30 ${farkVar ? 'bg-amber-50/20' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                            <Store size={12} className="text-primary-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{r.ad}</p>
                            <p className="text-xs text-gray-400">{r.calisma_tipi}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-primary-600">{r.paket_sayisi}</td>
                      <td className="px-4 py-3 text-right text-gray-700">₺{fmt(r.nakit)}</td>
                      <td className="px-4 py-3 text-right text-gray-500">₺{fmt(r.kredi_karti)}</td>
                      <td className="px-4 py-3 text-right text-gray-500">₺{fmt(r.yemek_karti)}</td>
                      <td className="px-4 py-3 text-right text-gray-500">₺{fmt(r.online)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">₺{fmt(r.toplam_satis)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-primary-600">₺{fmt(r.tasima_ucreti)}</td>
                      <td className="px-4 py-3 text-right text-emerald-600">₺{fmt(r.alinan)}</td>
                      <td className="px-4 py-3 text-right">
                        {!farkVar ? (
                          <span className="flex items-center justify-end gap-1 text-emerald-600 text-xs font-medium">
                            <CheckCircle2 size={12} /> Tamam
                          </span>
                        ) : r.net_fark > 0 ? (
                          <span className="flex items-center justify-end gap-1 text-red-500 text-xs font-semibold">
                            <TrendingDown size={12} /> ₺{fmt(r.net_fark)} alacak
                          </span>
                        ) : (
                          <span className="flex items-center justify-end gap-1 text-amber-500 text-xs font-semibold">
                            <TrendingUp size={12} /> ₺{fmt(Math.abs(r.net_fark))} verecek
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
