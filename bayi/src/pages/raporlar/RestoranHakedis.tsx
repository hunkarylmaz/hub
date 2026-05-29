import { useState, useEffect, useCallback } from 'react'
import { Loader2, Store, ChevronLeft, ChevronRight } from 'lucide-react'
import { api, RestoranHakedisRow } from '../../lib/api'

function defaultStart() {
  const d = new Date(); d.setDate(d.getDate() - 7); d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 16)
}
function defaultEnd() {
  const d = new Date(); d.setHours(23, 59, 0, 0)
  return d.toISOString().slice(0, 16)
}
function fmt(n: number) { return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

export default function RestoranHakedis() {
  const [data, setData] = useState<{
    restoranlar: RestoranHakedisRow[]
    toplam_restoran: number
    toplam_paket: number
    toplam_gelir: number
    net_kazanc: number
    sayfa_sayisi: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [baslangic, setBaslangic] = useState(defaultStart)
  const [bitis, setBitis] = useState(defaultEnd)
  const [sayfa, setSayfa] = useState(1)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      setData(await api.raporlar.restoranlarHakedis({ baslangic, bitis, sayfa }))
    } finally { setLoading(false) }
  }, [baslangic, bitis, sayfa])

  useEffect(() => { fetchData() }, [fetchData])

  const restoranlar = data?.restoranlar || []

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      {/* Left */}
      <div className="lg:w-64 shrink-0 space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Store size={14} className="text-primary-600" />
            <h3 className="text-sm font-semibold text-gray-800">Restoran Raporu</h3>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Başlangıç</label>
            <input type="datetime-local" value={baslangic} onChange={e => setBaslangic(e.target.value)}
              className="w-full px-2 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Bitiş</label>
            <input type="datetime-local" value={bitis} onChange={e => setBitis(e.target.value)}
              className="w-full px-2 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Sayfa Başına Kayıt</label>
            <select className="w-full px-2 py-2 text-xs border border-gray-200 rounded-lg">
              <option>10 kayıt</option><option>25 kayıt</option><option>50 kayıt</option>
            </select>
          </div>
          <button onClick={() => { setSayfa(1); fetchData() }} className="w-full py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">
            Filtrele
          </button>
        </div>

        {data && (
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Genel Özet</p>
            <div className="space-y-2 text-sm">
              {[
                ['Toplam Restoran', String(data.toplam_restoran)],
                ['Toplam Paket', String(data.toplam_paket)],
                ['Toplam Gelir', '₺' + fmt(data.toplam_gelir)],
                ['Net Kazanç', '₺' + fmt(data.net_kazanc)],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between">
                  <span className="text-gray-500">{l}</span>
                  <span className={`font-semibold ${l === 'Net Kazanç' ? 'text-emerald-600' : 'text-gray-800'}`}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Table */}
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Restoran Listesi ({restoranlar.length})
          <input placeholder="Restoran ara..." className="ml-3 px-3 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 font-normal" />
        </h3>
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-primary-600" /></div>
          ) : restoranlar.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">Bu dönem için veri bulunamadı</div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Firma</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Paket</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Nakit</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Kredi Kartı</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Yemek Kartı</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Online</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Toplam Gelir</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Taşıma Ücreti</th>
                  </tr>
                </thead>
                <tbody>
                  {restoranlar.map(r => (
                    <tr key={r.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Store size={12} className="text-primary-600" />
                          </div>
                          <div>
                            <span className="font-medium text-gray-800">{r.ad}</span>
                            <p className="text-xs text-gray-400">{r.calisma_tipi}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-primary-600">{r.paket_sayisi}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{r.nakit > 0 ? '₺' + fmt(r.nakit) : '₺0,00'}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{r.kredi_karti > 0 ? '₺' + fmt(r.kredi_karti) : '₺0,00'}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{r.yemek_karti > 0 ? '₺' + fmt(r.yemek_karti) : '₺0,00'}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{r.online > 0 ? '₺' + fmt(r.online) : '₺0,00'}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">₺{fmt(r.toplam_gelir)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-primary-600">₺{fmt(r.tasima)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(data?.sayfa_sayisi || 1) > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Sayfa {sayfa} / {data?.sayfa_sayisi}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setSayfa(p => Math.max(1, p - 1))} disabled={sayfa === 1}
                      className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                      <ChevronLeft size={13} />
                    </button>
                    <button onClick={() => setSayfa(p => Math.min(data?.sayfa_sayisi || 1, p + 1))} disabled={sayfa === (data?.sayfa_sayisi || 1)}
                      className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
