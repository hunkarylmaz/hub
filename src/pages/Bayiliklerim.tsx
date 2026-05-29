import { useState } from 'react'
import { Search, Plus, ChevronDown } from 'lucide-react'

interface Bayilik {
  id: string
  ad: string
  bayilikId: string
  durum: 'Aktif' | 'Pasif'
  sehir: string
  token: number
  ozelFiyat: number
}

const data: Bayilik[] = [
  { id: '1', ad: 'TEST JET', bayilikId: '0FNA19SWUL88F6E', durum: 'Aktif', sehir: 'İzmir', token: 0, ozelFiyat: 2.80 },
  { id: '2', ad: 'Paketçiniz Afyon', bayilikId: 'Afyonkarahisar002', durum: 'Aktif', sehir: 'Afyonkarahisar', token: 216, ozelFiyat: 2.80 },
  { id: '3', ad: 'Moon Courie', bayilikId: 'Bursa009', durum: 'Pasif', sehir: 'Bursa', token: 0, ozelFiyat: 3.00 },
  { id: '4', ad: 'Paketçiniz Kütahya', bayilikId: 'KUTAHYA003', durum: 'Pasif', sehir: 'KÜTAHYA', token: 0, ozelFiyat: 3.00 },
  { id: '5', ad: 'Osmaniye Paketçiniz', bayilikId: 'OSMANİYE005', durum: 'Aktif', sehir: 'Osmaniye', token: 3130, ozelFiyat: 2.80 },
  { id: '6', ad: 'Paketçiniz Bodrum', bayilikId: 'MUGLA002', durum: 'Aktif', sehir: 'Muğla', token: 414, ozelFiyat: 2.80 },
]

export default function Bayiliklerim() {
  const [search, setSearch] = useState('')

  const filtered = data.filter(
    (b) =>
      b.ad.toLowerCase().includes(search.toLowerCase()) ||
      b.bayilikId.toLowerCase().includes(search.toLowerCase()) ||
      b.sehir.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Bayiliklerim</h1>
          <p className="text-sm text-gray-500 mt-0.5">Toplam {data.length} kayıt</p>
        </div>
        <div className="flex items-center gap-3">
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
          <button className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
            <Plus size={16} />
            Yeni Bayilik
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Bayilik Adı</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Bayilik ID</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Durum</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Şehir</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Token</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Özel Fiyat</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Araçlar</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-700">{b.ad}</td>
                <td className="px-6 py-4 text-sm text-primary-600 font-medium cursor-pointer hover:underline">{b.bayilikId}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      b.durum === 'Aktif'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {b.durum}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{b.sehir}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{b.token}</td>
                <td className="px-6 py-4 text-sm text-emerald-600 font-medium">{b.ozelFiyat.toFixed(2)} ₺</td>
                <td className="px-6 py-4">
                  <button className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium">
                    Düzenle <ChevronDown size={14} />
                  </button>
                </td>
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
