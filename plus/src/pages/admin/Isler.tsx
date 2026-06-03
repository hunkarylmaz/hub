import { useEffect, useState, useCallback } from 'react'
import { MapPin, ChevronRight, RefreshCw, Loader2, Check, X } from 'lucide-react'
import { api, Is } from '../../lib/api'

interface Tasiyici { id: number; ad: string; arac_tipi: string }

const DURUM_CONFIG: Record<string, string> = {
  'Havuzda':       'bg-sky-50 text-sky-700 border-sky-200',
  'Alındı':        'bg-amber-50 text-amber-700 border-amber-200',
  'Yolda':         'bg-blue-50 text-blue-700 border-blue-200',
  'Teslim Edildi': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'İptal':         'bg-red-50 text-red-700 border-red-200',
}

export default function AdminIsler() {
  const [isler, setIsler] = useState<Is[]>([])
  const [tasiyicilar, setTasiyicilar] = useState<Tasiyici[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDurum, setFilterDurum] = useState('')
  const [atama, setAtama] = useState<{ isId: number; tasiyiciId: string } | null>(null)
  const [atamaLoading, setAtamaLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [i, t] = await Promise.all([
      api.admin.isler.list(filterDurum),
      api.admin.tasiyicilar.list(),
    ])
    setIsler(i); setTasiyicilar(t.filter((t: Tasiyici & { aktif: number }) => t.aktif))
    setLoading(false)
  }, [filterDurum])

  useEffect(() => { load() }, [load])

  async function handleAta(isId: number) {
    if (!atama?.tasiyiciId) return
    setAtamaLoading(true)
    try {
      await api.admin.isler.ata(isId, Number(atama.tasiyiciId))
      setAtama(null); load()
    } catch (e) { alert((e as Error).message) }
    finally { setAtamaLoading(false) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">İşler</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tüm işler ve manuel atama</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'Havuzda', 'Alındı', 'Yolda', 'Teslim Edildi', 'İptal'].map(d => (
          <button key={d} onClick={() => setFilterDurum(d)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filterDurum === d ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}>
            {d || 'Tümü'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card py-12 text-center text-sm text-gray-400">Yükleniyor...</div>
      ) : (
        <div className="space-y-2">
          {isler.map(is => (
            <div key={is.id} className="card p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-gray-900">#{String(is.id).padStart(4,'0')}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${DURUM_CONFIG[is.durum] || ''}`}>{is.durum}</span>
                    <span className="text-xs text-gray-400">{is.paket_boyutu}</span>
                    {is.fiyat > 0 && <span className="text-xs font-semibold text-emerald-600">₺{is.fiyat.toFixed(2)}</span>}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-0.5">
                    <MapPin size={10} className="text-primary-400" />
                    <span>{is.alis_il}/{is.alis_ilce}</span>
                    <ChevronRight size={10} className="text-gray-300" />
                    <span>{is.birakilis_il}/{is.birakilis_ilce}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {is.partner_firma && <span>Partner: <span className="text-gray-600">{is.partner_firma}</span></span>}
                    {is.tasiyici_ad
                      ? <span>Taşıyıcı: <span className="text-gray-600">{is.tasiyici_ad}</span></span>
                      : <span className="text-amber-500">Taşıyıcı yok</span>}
                  </div>
                </div>

                {/* Manuel atama — sadece Havuzda olanlar */}
                {is.durum === 'Havuzda' && (
                  <div className="shrink-0">
                    {atama?.isId === is.id ? (
                      <div className="flex items-center gap-2">
                        <select value={atama.tasiyiciId}
                          onChange={e => setAtama({ isId: is.id, tasiyiciId: e.target.value })}
                          className="text-xs rounded-lg border border-gray-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500">
                          <option value="">Taşıyıcı seç...</option>
                          {tasiyicilar.map(t => (
                            <option key={t.id} value={t.id}>{t.ad} ({t.arac_tipi})</option>
                          ))}
                        </select>
                        <button onClick={() => handleAta(is.id)} disabled={atamaLoading || !atama.tasiyiciId}
                          className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
                          {atamaLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        </button>
                        <button onClick={() => setAtama(null)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-400">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setAtama({ isId: is.id, tasiyiciId: '' })}
                        className="px-3 py-1.5 rounded-xl bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700">
                        Manuel Ata
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isler.length === 0 && (
            <div className="card py-12 text-center text-sm text-gray-400">İş bulunamadı</div>
          )}
        </div>
      )}
    </div>
  )
}
