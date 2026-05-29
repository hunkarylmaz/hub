import { useState, useEffect, useCallback } from 'react'
import { Loader2, ChevronDown, ChevronUp, Users } from 'lucide-react'
import { api, KuryeHakedisRow } from '../../lib/api'

function defaultStart() {
  const d = new Date(); d.setDate(d.getDate() - 7); d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 16)
}
function defaultEnd() {
  const d = new Date(); d.setHours(23, 59, 0, 0)
  return d.toISOString().slice(0, 16)
}
function fmt(n: number) { return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

export default function KuryeHakedis() {
  const [data, setData] = useState<{ kuryeler: KuryeHakedisRow[]; toplam_kurye: number; toplam_paket: number; toplam_kazanc: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [baslangic, setBaslangic] = useState(defaultStart)
  const [bitis, setBitis] = useState(defaultEnd)
  const [expanded, setExpanded] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await api.raporlar.kuryelerHakedis({ baslangic, bitis })
      setData(result)
    } finally { setLoading(false) }
  }, [baslangic, bitis])

  useEffect(() => { fetchData() }, [fetchData])

  const kuryeler = data?.kuryeler || []

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      {/* Left: Filter + Stats */}
      <div className="lg:w-64 shrink-0 space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-primary-600" />
            <h3 className="text-sm font-semibold text-gray-800">Kurye Kazanç Raporu</h3>
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
          <button onClick={fetchData} className="w-full py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">
            Filtrele
          </button>
        </div>

        {data && (
          <div className="space-y-2">
            {[
              { label: 'Toplam Kurye', value: String(data.toplam_kurye), color: 'bg-purple-100 text-purple-700' },
              { label: 'Toplam Sipariş', value: String(data.toplam_paket), color: 'bg-blue-100 text-blue-700' },
              { label: 'Toplam Kazanç', value: '₺' + fmt(data.toplam_kazanc), color: 'bg-amber-100 text-amber-700' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${s.color}`}>
                  {s.label === 'Toplam Kurye' ? '👤' : s.label === 'Toplam Sipariş' ? '📦' : '₺'}
                </div>
                <div>
                  <p className="text-xs text-gray-400">{s.label}</p>
                  <p className="text-base font-bold text-gray-800">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Kurye List */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Kurye Kazançları ({kuryeler.length})</h3>
          <input placeholder="Kurye ara..." className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg w-40 focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 bg-white rounded-xl border border-gray-100">
            <Loader2 size={24} className="animate-spin text-primary-600" />
          </div>
        ) : kuryeler.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400 bg-white rounded-xl border border-gray-100">Bu dönem için veri bulunamadı</div>
        ) : (
          <div className="space-y-2">
            {kuryeler.map(k => (
              <div key={k.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setExpanded(expanded === k.id ? null : k.id)}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary-600">{k.ad.charAt(0)}</span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-800">{k.ad}</p>
                      <p className="text-xs text-gray-400">{k.calisma_tipi} · {k.toplam_paket} paket</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold text-primary-600">₺{fmt(k.brut_kazanc)}</span>
                    {expanded === k.id ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                  </div>
                </button>

                {expanded === k.id && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3 grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-0.5">Brüt Kazanç</p>
                      <p className="font-semibold text-gray-800">₺{fmt(k.brut_kazanc)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-0.5">Ödenen (Aldım)</p>
                      <p className="font-semibold text-red-600">₺{fmt(k.aldim_toplam)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-0.5">Net Borç</p>
                      <p className="font-semibold text-emerald-600">₺{fmt(k.brut_kazanc - k.aldim_toplam)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-0.5">Tahsil Edilen Ciro</p>
                      <p className="font-semibold text-gray-800">₺{fmt(k.ciro)}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
