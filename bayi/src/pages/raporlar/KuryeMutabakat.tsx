import { useState, useEffect, useCallback } from 'react'
import { Loader2, Users, AlertTriangle, CheckCircle2, TrendingDown } from 'lucide-react'
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

type KuryeMutabakatRow = {
  id: number; ad: string; telefon: string | null
  paket_sayisi: number
  nakit: number; kredi_karti: number; yemek_karti: number; online: number
  toplam_tahsilat: number; odenmesi_gereken: number
  alinan: number; verilen: number; net_fark: number; hakedis: number
}

export default function KuryeMutabakat() {
  const [data, setData] = useState<{ kuryeler: KuryeMutabakatRow[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [baslangic, setBaslangic] = useState(defaultStart)
  const [bitis, setBitis] = useState(defaultEnd)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try { setData(await api.mutabakat.kuryeler({ baslangic, bitis })) }
    finally { setLoading(false) }
  }, [baslangic, bitis])

  useEffect(() => { fetchData() }, [fetchData])

  const kuryeler = data?.kuryeler || []
  const farklilar = kuryeler.filter(k => Math.abs(k.net_fark) > 0.01)
  const toplam_fark = kuryeler.reduce((a, k) => a + k.net_fark, 0)

  return (
    <div>
      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div className="flex items-center gap-2 mr-2">
          <Users size={14} className="text-primary-600" />
          <span className="text-sm font-semibold text-gray-800">Kurye Mutabakatı</span>
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

      {/* Summary cards */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {[
            { label: 'Toplam Kurye', value: String(kuryeler.length), color: 'text-gray-800' },
            { label: 'Toplam Paket', value: String(kuryeler.reduce((a, k) => a + k.paket_sayisi, 0)), color: 'text-primary-600' },
            { label: 'Toplam Nakit Tahsilat', value: '₺' + fmt(kuryeler.reduce((a, k) => a + k.nakit, 0)), color: 'text-emerald-600' },
            { label: 'Toplam Fark', value: (toplam_fark >= 0 ? '+' : '') + '₺' + fmt(toplam_fark), color: toplam_fark > 0.01 ? 'text-red-500' : toplam_fark < -0.01 ? 'text-amber-500' : 'text-emerald-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Fark uyarısı */}
      {!loading && farklilar.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">{farklilar.length} kuryede nakit farkı tespit edildi</p>
            <p className="text-xs text-amber-600 mt-0.5">Kazançtan otomatik düşülecek fark bakiye hareketi olarak kayıt altına alınmalıdır.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-primary-600" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Kurye</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Paket</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Nakit</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Kredi Kartı</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Yemek Kartı</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Online</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Teslim Alınan</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Hakediş</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Fark</th>
              </tr>
            </thead>
            <tbody>
              {kuryeler.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400 text-sm">Bu dönem için veri bulunamadı</td></tr>
              ) : (
                kuryeler.map(k => {
                  const farkVar = Math.abs(k.net_fark) > 0.01
                  return (
                    <tr key={k.id} className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/30 ${farkVar ? 'bg-amber-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xs font-bold shrink-0">
                            {k.ad.split(' ').map((n: string) => n[0]).join('').slice(0,2)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{k.ad}</p>
                            {k.telefon && <p className="text-xs text-gray-400">{k.telefon}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-primary-600">{k.paket_sayisi}</td>
                      <td className="px-4 py-3 text-right text-gray-700">₺{fmt(k.nakit)}</td>
                      <td className="px-4 py-3 text-right text-gray-500">₺{fmt(k.kredi_karti)}</td>
                      <td className="px-4 py-3 text-right text-gray-500">₺{fmt(k.yemek_karti)}</td>
                      <td className="px-4 py-3 text-right text-gray-500">₺{fmt(k.online)}</td>
                      <td className="px-4 py-3 text-right text-emerald-600">₺{fmt(k.alinan)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-700">₺{fmt(k.hakedis)}</td>
                      <td className="px-4 py-3 text-right">
                        {!farkVar ? (
                          <span className="flex items-center justify-end gap-1 text-emerald-600 text-xs font-medium">
                            <CheckCircle2 size={12} /> Eşit
                          </span>
                        ) : k.net_fark > 0 ? (
                          <span className="flex items-center justify-end gap-1 text-red-500 text-xs font-semibold">
                            <TrendingDown size={12} /> ₺{fmt(k.net_fark)} eksik
                          </span>
                        ) : (
                          <span className="flex items-center justify-end gap-1 text-amber-500 text-xs font-semibold">
                            +₺{fmt(Math.abs(k.net_fark))} fazla
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
