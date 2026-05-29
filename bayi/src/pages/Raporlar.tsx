import { useState, useEffect, useCallback } from 'react'
import { Loader2, AlertCircle, Download } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api, Siparis } from '../lib/api'

type Tab = 'gecmis' | 'kurye' | 'restoran' | 'trend'

function durumBadge(durum: Siparis['durum']) {
  const map: Record<string, string> = { 'Beklemede': 'bg-amber-100 text-amber-700', 'Atandı': 'bg-blue-100 text-blue-700', 'Yolda': 'bg-indigo-100 text-indigo-700', 'Teslim Edildi': 'bg-emerald-100 text-emerald-700', 'İptal': 'bg-red-100 text-red-600' }
  return map[durum] || 'bg-gray-100 text-gray-600'
}

function formatTarih(dt: string) {
  const d = new Date(dt)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function Raporlar() {
  const [tab, setTab] = useState<Tab>('gecmis')
  const [data, setData] = useState<{
    siparisler: Siparis[]
    kurye_hakedis: { ad: string; teslim_sayisi: number; toplam_tutar: number }[]
    restoran_hakedis: { ad: string; siparis_sayisi: number; toplam_tutar: number }[]
    gunluk_trend: { gun: string; siparis: number; ciro: number }[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [baslangic, setBaslangic] = useState('')
  const [bitis, setBitis] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      setData(await api.raporlar.get({ baslangic: baslangic || undefined, bitis: bitis || undefined }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veri yüklenemedi')
    } finally { setLoading(false) }
  }, [baslangic, bitis])

  useEffect(() => { fetchData() }, [fetchData])

  const tabs: { key: Tab; label: string }[] = [
    { key: 'gecmis', label: 'Geçmiş Siparişler' },
    { key: 'kurye', label: 'Kurye Hakediş' },
    { key: 'restoran', label: 'Restoran Hakediş' },
    { key: 'trend', label: 'Günlük Trend' },
  ]

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-600" /></div>
  if (error) return <div className="flex flex-col items-center justify-center py-20 gap-4"><AlertCircle size={32} className="text-red-500" /><p className="text-gray-600">{error}</p><button onClick={fetchData} className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg">Tekrar Dene</button></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Raporlar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Detaylı sipariş ve hakediş raporları</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
          <Download size={15} /> Rapor Al
        </button>
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Başlangıç:</label>
          <input type="date" value={baslangic} onChange={e => setBaslangic(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Bitiş:</label>
          <input type="date" value={bitis} onChange={e => setBitis(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
        </div>
        {(baslangic || bitis) && (
          <button onClick={() => { setBaslangic(''); setBitis('') }} className="text-xs text-gray-500 hover:text-gray-700">Temizle</button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'gecmis' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Sipariş No','Restoran','Müşteri','Kurye','Tutar','Ödeme','Durum','Tarih'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.siparisler.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400 text-sm">Sipariş bulunamadı</td></tr>
              ) : (
                data?.siparisler.map(s => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-xs font-mono text-gray-700">{s.siparis_no}</td>
                    <td className="px-5 py-3 text-sm text-gray-700">{s.restoran_ad || '—'}</td>
                    <td className="px-5 py-3 text-sm text-gray-700">{s.musteri_ad || '—'}</td>
                    <td className="px-5 py-3 text-sm text-gray-700">{s.kurye_ad || '—'}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-gray-800">{s.tutar.toFixed(2)} ₺</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{s.odeme_yontemi}</td>
                    <td className="px-5 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${durumBadge(s.durum)}`}>{s.durum}</span></td>
                    <td className="px-5 py-3 text-xs text-gray-500">{formatTarih(s.olusturma_tarihi)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {data && data.siparisler.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">{data.siparisler.length} kayıt</span>
              <span className="text-sm font-semibold text-gray-800">
                Toplam: {data.siparisler.reduce((a, s) => a + s.tutar, 0).toFixed(2)} ₺
              </span>
            </div>
          )}
        </div>
      )}

      {tab === 'kurye' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Kurye','Teslim Sayısı','Toplam Ciro'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.kurye_hakedis.map((k, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-800">{k.ad}</td>
                    <td className="px-5 py-3 text-sm text-gray-700">{k.teslim_sayisi || 0}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-emerald-600">{(k.toplam_tutar || 0).toFixed(2)} ₺</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Kurye Teslim Dağılımı</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.kurye_hakedis.map(k => ({ name: k.ad.split(' ')[0], value: k.teslim_sayisi || 0 }))} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: 12 }} />
                  <Bar dataKey="value" fill="#2563EB" radius={[4,4,0,0]} name="Teslimat" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'restoran' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Restoran','Sipariş Sayısı','Toplam Ciro'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.restoran_hakedis.map((r, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-800">{r.ad}</td>
                    <td className="px-5 py-3 text-sm text-gray-700">{r.siparis_sayisi || 0}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-emerald-600">{(r.toplam_tutar || 0).toFixed(2)} ₺</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Restoran Ciro Dağılımı</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.restoran_hakedis.map(r => ({ name: r.ad.split(' ')[0], value: r.toplam_tutar || 0 }))} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: 12 }} formatter={(v: number) => [`${v.toFixed(2)} ₺`, 'Ciro']} />
                  <Bar dataKey="value" fill="#10B981" radius={[4,4,0,0]} name="Ciro" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'trend' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Günlük Sipariş & Ciro Trendi</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.gunluk_trend.map(g => ({ ...g, gun: g.gun.slice(5) }))} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="gun" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: 12 }} />
                <Line yAxisId="left" type="monotone" dataKey="siparis" stroke="#2563EB" strokeWidth={2} dot={{ fill: '#2563EB', r: 3 }} name="Sipariş" />
                <Line yAxisId="right" type="monotone" dataKey="ciro" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 3 }} name="Ciro (₺)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
