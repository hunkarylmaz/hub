import { useState } from 'react'
import { Wallet, Upload, Search, RefreshCw } from 'lucide-react'

interface KontorIslem {
  id: string
  tarih: string
  islemTuru: 'Bayiliğe Dağıtım' | 'Geri Alma'
  bayilikAd: string
  bayilikId: string
  miktar: number
  kalanBakiye: number
  not: string
}

const data: KontorIslem[] = [
  { id: '1', tarih: '27.05.2026 23:38', islemTuru: 'Bayiliğe Dağıtım', bayilikAd: 'Paketçiniz Afyon', bayilikId: 'Afyonkarahisar002', miktar: -87, kalanBakiye: 0, not: '-' },
  { id: '2', tarih: '27.05.2026 23:38', islemTuru: 'Bayiliğe Dağıtım', bayilikAd: 'Paketçiniz Afyon', bayilikId: 'Afyonkarahisar002', miktar: -100, kalanBakiye: 87, not: '-' },
  { id: '3', tarih: '27.05.2026 23:37', islemTuru: 'Bayiliğe Dağıtım', bayilikAd: 'Paketçiniz Bodrum', bayilikId: 'MUGLA002', miktar: -500, kalanBakiye: 187, not: '-' },
  { id: '4', tarih: '27.05.2026 23:37', islemTuru: 'Geri Alma', bayilikAd: 'Moon Courie', bayilikId: 'Bursa009', miktar: 489, kalanBakiye: 687, not: '-' },
  { id: '5', tarih: '26.05.2026 00:24', islemTuru: 'Bayiliğe Dağıtım', bayilikAd: 'Paketçiniz Bodrum', bayilikId: 'MUGLA002', miktar: -202, kalanBakiye: 198, not: '-' },
]

export default function KontorGecmisi() {
  const [search, setSearch] = useState('')

  const filtered = data.filter(
    (k) =>
      k.bayilikAd.toLowerCase().includes(search.toLowerCase()) ||
      k.islemTuru.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div>
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl p-6 flex items-center gap-4" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' }}>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Wallet size={24} className="text-white" />
          </div>
          <div>
            <p className="text-sm text-purple-200 font-medium">Mevcut Bakiye</p>
            <p className="text-3xl font-bold text-white mt-0.5">500</p>
          </div>
        </div>

        <div className="rounded-xl p-6 flex items-center gap-4" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Upload size={24} className="text-white" />
          </div>
          <div>
            <p className="text-sm text-emerald-100 font-medium">Toplam Dağıtılan</p>
            <p className="text-3xl font-bold text-white mt-0.5">8.820</p>
          </div>
        </div>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Kontör Geçmişi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Toplam 41 kayıt</p>
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
            {filtered.map((k) => (
              <tr key={k.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-600">{k.tarih}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {k.islemTuru === 'Bayiliğe Dağıtım' ? (
                      <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
                        <Upload size={13} className="text-primary-600" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center">
                        <RefreshCw size={13} className="text-amber-500" />
                      </div>
                    )}
                    <span className="text-sm text-gray-700">{k.islemTuru}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-700">{k.bayilikAd}</div>
                  <div className="text-xs text-gray-400">{k.bayilikId}</div>
                </td>
                <td className="px-6 py-4 text-sm font-semibold">
                  <span className={k.miktar < 0 ? 'text-red-500' : 'text-emerald-600'}>
                    {k.miktar > 0 ? `+${k.miktar}` : k.miktar}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-primary-600">{k.kalanBakiye}</td>
                <td className="px-6 py-4 text-sm text-gray-400">{k.not}</td>
              </tr>
            ))}
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
