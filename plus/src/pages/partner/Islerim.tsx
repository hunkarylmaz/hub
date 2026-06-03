import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Package, MapPin, Clock, Search, Filter, Plus, ChevronRight, XCircle, RefreshCw } from 'lucide-react'
import { api, Is, IsDurum } from '../../lib/api'

const DURUMLAR: (IsDurum | 'Tümü')[] = ['Tümü', 'Havuzda', 'Alındı', 'Yolda', 'Teslim Edildi', 'İptal']

const DURUM_CONFIG: Record<string, { color: string; dot: string }> = {
  'Havuzda':       { color: 'bg-sky-50 text-sky-700 border-sky-200',            dot: 'bg-sky-400' },
  'Alındı':        { color: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-400' },
  'Yolda':         { color: 'bg-blue-50 text-blue-700 border-blue-200',          dot: 'bg-blue-500' },
  'Teslim Edildi': { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  'İptal':         { color: 'bg-red-50 text-red-700 border-red-200',             dot: 'bg-red-400' },
}

const BOYUT_EMOJI: Record<string,string> = { 'Zarf':'✉️','Küçük':'📦','Orta':'🗃️','Büyük':'📫','Koli':'🏗️' }

function StatusBadge({ durum }: { durum: string }) {
  const cfg = DURUM_CONFIG[durum] || DURUM_CONFIG['Havuzda']
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {durum}
    </span>
  )
}

export default function Islerim() {
  const [isler, setIsler] = useState<Is[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<IsDurum | 'Tümü'>('Tümü')
  const [search, setSearch] = useState('')
  const [cancelling, setCancelling] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await api.partner.islerim()
    setIsler(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleIptal(id: number, e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    if (!confirm('Bu işi iptal etmek istediğinizden emin misiniz?')) return
    setCancelling(id)
    try { await api.partner.isIptal(id); load() }
    catch (err) { alert((err as Error).message) }
    finally { setCancelling(null) }
  }

  const filtered = isler.filter(i => {
    const matchDurum = filter === 'Tümü' || i.durum === filter
    const matchSearch = !search || [i.alis_il, i.birakilis_il, i.gonderici_ad, i.alici_ad, String(i.id)]
      .some(v => v.toLowerCase().includes(search.toLowerCase()))
    return matchDurum && matchSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">İşlerim</h1>
          <p className="text-sm text-gray-500 mt-0.5">Oluşturduğunuz tüm işler</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500">
            <RefreshCw size={16} />
          </button>
          <Link to="/partner/is-olustur" className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Yeni İş
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="İş no, il, isim ara..."
            className="input-field pl-9 py-2" />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <Filter size={14} className="text-gray-400 shrink-0 mr-1" />
          {DURUMLAR.map(d => (
            <button key={d} onClick={() => setFilter(d)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                filter === d
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="card py-16 text-center text-sm text-gray-400">Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div className="card py-16 text-center">
          <Package size={36} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm text-gray-500">{search || filter !== 'Tümü' ? 'Sonuç bulunamadı' : 'Henüz iş oluşturmadınız'}</p>
          {!search && filter === 'Tümü' && (
            <Link to="/partner/is-olustur" className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary-600 font-semibold hover:underline">
              <Plus size={14} /> İş oluştur
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(is => (
            <Link key={is.id} to={`/partner/is/${is.id}`}
              className="card flex items-center gap-4 p-4 hover:shadow-md transition-all group">
              {/* Emoji */}
              <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-xl shrink-0">
                {BOYUT_EMOJI[is.paket_boyutu] || '📦'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-gray-900">#{String(is.id).padStart(4,'0')}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-sm text-gray-600">{is.paket_boyutu}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <MapPin size={11} className="text-primary-400 shrink-0" />
                  <span className="font-medium text-gray-700">{is.alis_il}/{is.alis_ilce}</span>
                  <ChevronRight size={10} className="text-gray-300" />
                  <span className="font-medium text-gray-700">{is.birakilis_il}/{is.birakilis_ilce}</span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                  <span>{is.gonderici_ad} → {is.alici_ad}</span>
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(is.alinma_saati).toLocaleString('tr-TR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                  </span>
                </div>
              </div>

              {/* Status + actions */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <StatusBadge durum={is.durum} />
                {is.durum === 'Havuzda' && (
                  <button
                    onClick={(e) => handleIptal(is.id, e)}
                    disabled={cancelling === is.id}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium">
                    <XCircle size={12} />
                    {cancelling === is.id ? 'İptal ediliyor...' : 'İptal Et'}
                  </button>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
