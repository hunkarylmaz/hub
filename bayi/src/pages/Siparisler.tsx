import { useState, useEffect, useCallback } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { api, Siparis, Kurye, Restoran } from '../lib/api'
import SiparisTablosu from '../components/SiparisTablosu'

export default function Siparisler() {
  const [siparisler, setSiparisler] = useState<Siparis[]>([])
  const [kuryeler, setKuryeler] = useState<Kurye[]>([])
  const [restoranlar, setRestoranlar] = useState<Restoran[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [s, k, r] = await Promise.all([api.siparisler.list(), api.kuryeler.list(), api.restoranlar.list()])
      setSiparisler(s)
      setKuryeler(k)
      setRestoranlar(r)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veri yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 3000)
    return () => clearInterval(id)
  }, [fetchData])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={32} className="animate-spin text-primary-600" />
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <AlertCircle size={32} className="text-red-500" />
      <p className="text-gray-600">{error}</p>
      <button onClick={fetchData} className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg">Tekrar Dene</button>
    </div>
  )

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-gray-800">Siparişler</h1>
        <p className="text-sm text-gray-500 mt-0.5">{siparisler.length} sipariş</p>
      </div>

      <SiparisTablosu
        siparisler={siparisler}
        kuryeler={kuryeler}
        restoranlar={restoranlar}
        onRefresh={fetchData}
        title="Tüm Siparişler"
      />
    </div>
  )
}
