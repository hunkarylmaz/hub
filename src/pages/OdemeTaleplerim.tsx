interface OdemeTalebi {
  id: string
  talepNo: string
  bayilikAd: string
  bayilikId: string
  miktar: number
  banka: string
  gonderen: string
  tarih: string
  saat: string
  durum: string
}

const data: OdemeTalebi[] = [
  { id: '1', talepNo: 'ODEME-1778431897637-8', bayilikAd: 'Paketçiniz Afyon', bayilikId: 'Afyonkarahisar002', miktar: 151.20, banka: 'Garanti', gonderen: 'Süleyman Doğan', tarih: '10.05.2026', saat: '19:51', durum: 'Onaylandı' },
  { id: '2', talepNo: 'ODEME-1778431843767-7', bayilikAd: 'Paketçiniz Bodrum', bayilikId: 'MUGLA002', miktar: 1400.00, banka: 'Garanti', gonderen: 'Süleyman Doğan', tarih: '10.05.2026', saat: '19:50', durum: 'Onaylandı' },
  { id: '3', talepNo: 'ODEME-1777996115496-7', bayilikAd: 'Paketçiniz Afyon', bayilikId: 'Afyonkarahisar002', miktar: 568.40, banka: 'Garanti Bankası', gonderen: 'Süleyman Doğan', tarih: '05.05.2026', saat: '18:48', durum: 'Onaylandı' },
  { id: '4', talepNo: 'ODEME-1777996062788-6', bayilikAd: 'Paketçiniz Bodrum', bayilikId: 'MUGLA002', miktar: 580.00, banka: 'Garanti Bankası', gonderen: 'Süleyman Doğan', tarih: '05.05.2026', saat: '18:47', durum: 'Onaylandı' },
  { id: '5', talepNo: 'ODEME-1777985800787-5', bayilikAd: 'Osmaniye Paketçiniz', bayilikId: 'OSMANİYE005', miktar: 14000.00, banka: 'DENİZBANK', gonderen: 'ALİ BEÇENE', tarih: '05.05.2026', saat: '15:56', durum: 'Onaylandı' },
  { id: '6', talepNo: 'ODEME-1777786785325-3', bayilikAd: 'Test', bayilikId: 'AHG991HH4O', miktar: 1.00, banka: 'Garanti', gonderen: 'Test test', tarih: '03.05.2026', saat: '08:39', durum: 'Onaylandı' },
]

function formatMiktar(n: number): string {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function OdemeTaleplerim() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Ödeme Taleplerim</h1>
        <p className="text-sm text-gray-500 mt-0.5">Toplam {data.length} kayıt</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Talep No</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Bayilik</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Miktar</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Banka</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Gönderen</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tarih</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Durum</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Araçlar</th>
            </tr>
          </thead>
          <tbody>
            {data.map((t) => (
              <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <span className="text-sm text-primary-600 font-medium cursor-pointer hover:underline leading-relaxed">
                    {t.talepNo}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-700">{t.bayilikAd}</div>
                  <div className="text-xs text-gray-400">{t.bayilikId}</div>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-emerald-600">{formatMiktar(t.miktar)} ₺</td>
                <td className="px-6 py-4 text-sm text-gray-700">{t.banka}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{t.gonderen}</td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-700">{t.tarih}</div>
                  <div className="text-xs text-gray-400">{t.saat}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                    {t.durum}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <select className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600">
                    <option>Seçiniz</option>
                    <option>Detay Görüntüle</option>
                    <option>İptal Et</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
          <span className="text-sm text-gray-500">1–{data.length} / {data.length}</span>
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
