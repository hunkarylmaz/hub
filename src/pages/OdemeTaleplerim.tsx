import { useState, useEffect, useCallback } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { api, OdemeTalep } from '../lib/api'

function formatMiktar(n: number): string {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatTarih(tarih: string): { tarih: string; saat: string } {
  const d = new Date(tarih)
  if (isNaN(d.getTime())) return { tarih: tarih, saat: '' }
  const gun = String(d.getDate()).padStart(2, '0')
  const ay = String(d.getMonth() + 1).padStart(2, '0')
  const yil = d.getFullYear()
  const saat = String(d.getHours()).padStart(2, '0')
  const dakika = String(d.getMinutes()).padStart(2, '0')
  return { tarih: `${gun}.${ay}.${yil}`, saat: `${saat}:${dakika}` }
}

function durumBadgeClass(durum: string): string {
  switch (durum) {
    case 'Onaylandı': return 'bg-emerald-100 text-emerald-700'
    case 'Beklemede': return 'bg-amber-100 text-amber-600'
    case 'Reddedildi': return 'bg-red-100 text-red-600'
    default: return 'bg-gray-100 text-gray-600'
  }
}

export default function OdemeTaleplerim() {
  const [talepler, setTalepler] = useState<OdemeTalep[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const fetchTalepler = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.odemeTalepleri.list()
      setTalepler(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veri yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTalepler()
  }, [fetchTalepler])

  async function handleDurumChange(talep: OdemeTalep, newDurum: string) {
    if (newDurum === 'Seçiniz' || newDurum === talep.durum) return
    setUpdatingId(talep.id)
    try {
      const updated = await api.odemeTalepleri.updateDurum(talep.id, newDurum)
      setTalepler((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Güncelleme başarısız')
    } finally {
      setUpdatingId(null)
    }
  }

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
          onClick={fetchTalepler}
          className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Ödeme Taleplerim</h1>
        <p className="text-sm text-gray-500 mt-0.5">Toplam {talepler.length} kayıt</p>
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
            {talepler.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-400 text-sm">
                  Ödeme talebi bulunamadı
                </td>
              </tr>
            ) : (
              talepler.map((t) => {
                const { tarih, saat } = formatTarih(t.tarih)
                return (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm text-primary-600 font-medium cursor-pointer hover:underline leading-relaxed">
                        {t.talep_no}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-700">{t.bayilik_ad || '—'}</div>
                      <div className="text-xs text-gray-400">{t.bayilik_kod || '—'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-emerald-600">{formatMiktar(t.miktar)} ₺</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{t.banka || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{t.gonderen || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">{tarih}</div>
                      {saat && <div className="text-xs text-gray-400">{saat}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${durumBadgeClass(t.durum)}`}>
                        {t.durum}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {updatingId === t.id ? (
                        <Loader2 size={16} className="animate-spin text-primary-600" />
                      ) : (
                        <select
                          defaultValue="Seçiniz"
                          onChange={(e) => handleDurumChange(t, e.target.value)}
                          className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
                        >
                          <option value="Seçiniz">Seçiniz</option>
                          <option value="Onaylandı">Onayla</option>
                          <option value="Reddedildi">Reddet</option>
                          <option value="Beklemede">Beklemede</option>
                        </select>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
          <span className="text-sm text-gray-500">1–{talepler.length} / {talepler.length}</span>
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
