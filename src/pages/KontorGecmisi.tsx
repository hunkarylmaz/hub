import { useState, useEffect, useCallback } from 'react'
import { Wallet, Upload, Search, RefreshCw, AlertCircle, Loader2 } from 'lucide-react'
import { api, KontorIslem, KontorBakiye } from '../lib/api'

function formatTarih(tarih: string): string {
  const d = new Date(tarih)
  if (isNaN(d.getTime())) return tarih
  const gun = String(d.getDate()).padStart(2, '0')
  const ay = String(d.getMonth() + 1).padStart(2, '0')
  const yil = d.getFullYear()
  const saat = String(d.getHours()).padStart(2, '0')
  const dakika = String(d.getMinutes()).padStart(2, '0')
  return `${gun}.${ay}.${yil} ${saat}:${dakika}`
}

export default function KontorGecmisi() {
  const [gecmis, setGecmis] = useState<KontorIslem[]>([])
  const [bakiye, setBakiye] = useState<KontorBakiye>({ mevcut_bakiye: 0, toplam_dagitilan: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [gecmisData, bakiyeData] = await Promise.all([
        api.kontorGecmisi.list(),
        api.kontorBakiye.get(),
      ])
      setGecmis(gecmisData)
      setBakiye(bakiyeData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veri yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filtered = gecmis.filter(
    (k) =>
      (k.bayilik_ad || '').toLowerCase().includes(search.toLowerCase()) ||
      k.islem_turu.toLowerCase().includes(search.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle size={32} className="text-red-500" />
        <p className="text-gray-600">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl p-6 flex items-center gap-4" style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' }}>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Wallet size={24} className="text-white" />
          </div>
          <div>
            <p className="text-sm text-blue-200 font-medium">Mevcut Bakiye</p>
            <p className="text-3xl font-bold text-white mt-0.5">{bakiye.mevcut_bakiye.toLocaleString('tr-TR')}</p>
          </div>
        </div>

        <div className="rounded-xl p-6 flex items-center gap-4" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Upload size={24} className="text-white" />
          </div>
          <div>
            <p className="text-sm text-emerald-100 font-medium">Toplam Dağıtılan</p>
            <p className="text-3xl font-bold text-white mt-0.5">{bakiye.toplam_dagitilan.toLocaleString('tr-TR')}</p>
          </div>
        </div>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Kontör Geçmişi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Toplam {gecmis.length} kayıt</p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 w-56"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tarih</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">İşlem Türü</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Bayilik</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Miktar</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kalan Bakiye</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Not</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                  İşlem bulunamadı
                </td>
              </tr>
            ) : (
              filtered.map((k) => (
                <tr key={k.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-600">{formatTarih(k.tarih)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {k.islem_turu === 'Bayiliğe Dağıtım' ? (
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                          <Upload size={13} className="text-primary-600" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center">
                          <RefreshCw size={13} className="text-amber-500" />
                        </div>
                      )}
                      <span className="text-sm text-gray-700">{k.islem_turu}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-700">{k.bayilik_ad || '—'}</div>
                    <div className="text-xs text-gray-400">{k.bayilik_kod || '—'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold">
                    <span className={k.miktar < 0 ? 'text-red-500' : 'text-emerald-600'}>
                      {k.miktar > 0 ? `+${k.miktar}` : k.miktar}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-primary-600">{k.kalan_bakiye}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{k.not_text || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
          <span className="text-sm text-gray-500">1–{filtered.length} / {filtered.length}</span>
          <div className="flex items-center gap-1">
            <button className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700">İlk</button>
            <button className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700">‹</button>
            <button className="w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-medium">1</button>
            <button className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700">›</button>
            <button className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700">Son</button>
          </div>
        </div>
      </div>
    </div>
  )
}
