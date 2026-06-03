import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin, Package, Clock, Search, Filter, RefreshCw, Loader2, ChevronRight, Inbox
} from 'lucide-react'
import { api, Is } from '../../lib/api'
import { ILLER } from '../../lib/locations'

const BOYUT_EMOJI: Record<string,string> = { 'Zarf':'✉️','Küçük':'📦','Orta':'🗃️','Büyük':'📫','Koli':'🏗️' }

export default function Havuz() {
  const navigate = useNavigate()
  const [isler, setIsler] = useState<Is[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<number | null>(null)
  const [filterIl, setFilterIl] = useState('')
  const [filterIlce, setFilterIlce] = useState('')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const data = await api.tasiyici.havuz(filterIl, filterIlce)
    setIsler(data)
    setLoading(false)
  }, [filterIl, filterIlce])

  useEffect(() => { load() }, [load])

  async function handleAl(id: number) {
    if (!confirm('Bu işi almak istiyor musunuz?')) return
    setClaiming(id)
    try {
      await api.tasiyici.isAl(id)
      navigate('/tasiyici/islerim')
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setClaiming(null)
    }
  }

  const secilenIl = ILLER.find(i => i.il === filterIl)

  const filtered = isler.filter(is => {
    if (!search) return true
    return [is.alis_il, is.birakilis_il, is.alis_ilce, is.birakilis_ilce, String(is.id), is.paket_boyutu]
      .some(v => v.toLowerCase().includes(search.toLowerCase()))
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">İş Havuzu</h1>
          <p className="text-sm text-gray-500 mt-0.5">Taşıyıcı bekleyen işler</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400 shrink-0" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filtrele</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="İş no, il, boyut..."
              className="input-field pl-8 py-2 text-sm" />
          </div>
          <select value={filterIl}
            onChange={e => { setFilterIl(e.target.value); setFilterIlce('') }}
            className="input-field py-2 text-sm">
            <option value="">Tüm İller</option>
            {ILLER.map(i => <option key={i.il} value={i.il}>{i.il}</option>)}
          </select>
          <select value={filterIlce}
            onChange={e => setFilterIlce(e.target.value)}
            disabled={!filterIl}
            className="input-field py-2 text-sm disabled:opacity-50">
            <option value="">Tüm İlçeler</option>
            {secilenIl?.ilceler.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
      </div>

      {/* Count */}
      {!loading && (
        <p className="text-sm text-gray-500">
          <span className="font-bold text-gray-800">{filtered.length}</span> iş mevcut
        </p>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-emerald-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-16 text-center">
          <Inbox size={36} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">Şu an havuzda iş yok</p>
          <p className="text-xs text-gray-300 mt-1">Yeni işler geldiğinde burada görünür</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(is => (
            <div key={is.id} className="card p-5 hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                {/* Emoji */}
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl shrink-0">
                  {BOYUT_EMOJI[is.paket_boyutu] || '📦'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-gray-900">#{String(is.id).padStart(4,'0')}</span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">
                      {is.paket_boyutu}
                    </span>
                    {is.partner_firma && (
                      <span className="text-xs text-gray-400">{is.partner_firma}</span>
                    )}
                  </div>

                  {/* Route */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center">
                        <MapPin size={10} className="text-primary-600" />
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{is.alis_il}</span>
                      <span className="text-xs text-gray-400">{is.alis_ilce}</span>
                    </div>
                    <ChevronRight size={14} className="text-gray-300" />
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                        <MapPin size={10} className="text-emerald-600" />
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{is.birakilis_il}</span>
                      <span className="text-xs text-gray-400">{is.birakilis_ilce}</span>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock size={11} />
                    <span>Alınma: {new Date(is.alinma_saati).toLocaleString('tr-TR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</span>
                  </div>

                  {is.aciklama && (
                    <p className="mt-2 text-xs text-gray-500 italic">"{is.aciklama}"</p>
                  )}
                </div>

                {/* Action */}
                <div className="shrink-0">
                  <button
                    onClick={() => handleAl(is.id)}
                    disabled={claiming === is.id}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50">
                    {claiming === is.id
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Package size={14} />
                    }
                    {claiming === is.id ? 'Alınıyor...' : 'İşi Al'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
