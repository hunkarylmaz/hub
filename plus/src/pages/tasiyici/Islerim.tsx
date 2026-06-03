import { useEffect, useState, useCallback } from 'react'
import { MapPin, Clock, Loader2, CheckCircle2, ChevronRight, RefreshCw, Truck } from 'lucide-react'
import { api, Is } from '../../lib/api'

const BOYUT_EMOJI: Record<string,string> = { 'Zarf':'✉️','Küçük':'📦','Orta':'🗃️','Büyük':'📫','Koli':'🏗️' }

const DURUM_CONFIG: Record<string,{ color: string; bg: string; next?: string; nextLabel?: string; nextColor?: string }> = {
  'Alındı': { color: 'text-amber-700', bg: 'bg-amber-50', next: 'yolda',  nextLabel: 'Yola Çıktım',   nextColor: 'bg-blue-600 hover:bg-blue-700' },
  'Yolda':  { color: 'text-blue-700',  bg: 'bg-blue-50',  next: 'teslim', nextLabel: 'Teslim Ettim',   nextColor: 'bg-emerald-600 hover:bg-emerald-700' },
}

export default function TasiyiciIslerim() {
  const [isler, setIsler] = useState<Is[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<number | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await api.tasiyici.islerim()
    setIsler(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleUpdate(is: Is, action: 'yolda' | 'teslim') {
    if (!confirm(action === 'teslim' ? `#${String(is.id).padStart(4,'0')} numaralı işi teslim ettiniz mi?` : 'Yola çıktığınızı onaylıyor musunuz?')) return
    setUpdating(is.id)
    try {
      if (action === 'yolda') await api.tasiyici.yolda(is.id)
      else await api.tasiyici.teslimEt(is.id)
      load()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setUpdating(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={24} className="animate-spin text-emerald-600" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aktif İşlerim</h1>
          <p className="text-sm text-gray-500 mt-0.5">Aldığınız ve teslim etmediğiniz işler</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500">
          <RefreshCw size={16} />
        </button>
      </div>

      {isler.length === 0 ? (
        <div className="card py-16 text-center">
          <Truck size={36} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm text-gray-500">Aktif işiniz bulunmuyor</p>
          <a href="/tasiyici/havuz" className="inline-block mt-3 text-sm text-emerald-600 font-semibold hover:underline">
            Havuza git →
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {isler.map(is => {
            const cfg = DURUM_CONFIG[is.durum]
            const isExpanded = expanded === is.id

            return (
              <div key={is.id} className="card overflow-hidden">
                {/* Main row */}
                <div className="flex items-center gap-4 p-5 cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : is.id)}>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl shrink-0">
                    {BOYUT_EMOJI[is.paket_boyutu] || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900">#{String(is.id).padStart(4,'0')}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg?.bg || 'bg-gray-50'} ${cfg?.color || 'text-gray-600'}`}>
                        {is.durum}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <MapPin size={11} className="text-primary-400 shrink-0" />
                      <span className="font-medium">{is.alis_il}/{is.alis_ilce}</span>
                      <ChevronRight size={11} className="text-gray-300" />
                      <span className="font-medium">{is.birakilis_il}/{is.birakilis_ilce}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className={`text-gray-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4 space-y-4 bg-gray-50">
                    {/* Addresses */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-white rounded-xl p-3 border border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1.5">Alış</p>
                        <p className="text-sm font-semibold text-gray-700">{is.alis_il} / {is.alis_ilce}</p>
                        {is.alis_mahalle && <p className="text-xs text-gray-500">{is.alis_mahalle}</p>}
                        <p className="text-xs text-gray-500 mt-0.5">{is.alis_adres}</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 border border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1.5">Bırakılacak</p>
                        <p className="text-sm font-semibold text-gray-700">{is.birakilis_il} / {is.birakilis_ilce}</p>
                        {is.birakilis_mahalle && <p className="text-xs text-gray-500">{is.birakilis_mahalle}</p>}
                        <p className="text-xs text-gray-500 mt-0.5">{is.birakilis_adres}</p>
                      </div>
                    </div>

                    {/* People */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-xl p-3 border border-gray-100">
                        <p className="text-xs font-bold text-gray-400 mb-1">Gönderici</p>
                        <p className="text-sm font-semibold text-gray-700">{is.gonderici_ad}</p>
                        <a href={`tel:${is.gonderici_telefon}`} className="text-xs text-primary-600 font-medium">{is.gonderici_telefon}</a>
                      </div>
                      <div className="bg-white rounded-xl p-3 border border-gray-100">
                        <p className="text-xs font-bold text-gray-400 mb-1">Alıcı</p>
                        <p className="text-sm font-semibold text-gray-700">{is.alici_ad}</p>
                        <a href={`tel:${is.alici_telefon}`} className="text-xs text-primary-600 font-medium">{is.alici_telefon}</a>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock size={12} />
                      <span>Alınma saati: {new Date(is.alinma_saati).toLocaleString('tr-TR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</span>
                    </div>

                    {is.aciklama && (
                      <p className="text-xs text-gray-500 italic bg-amber-50 rounded-lg p-2.5">"{is.aciklama}"</p>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                {cfg?.next && (
                  <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-end">
                    <button
                      onClick={() => handleUpdate(is, cfg.next as 'yolda' | 'teslim')}
                      disabled={updating === is.id}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50 ${cfg.nextColor}`}>
                      {updating === is.id
                        ? <><Loader2 size={14} className="animate-spin" /> Güncelleniyor...</>
                        : <><CheckCircle2 size={14} /> {cfg.nextLabel}</>
                      }
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
