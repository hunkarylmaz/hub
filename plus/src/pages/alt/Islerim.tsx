import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, Plus, Inbox, Clock } from 'lucide-react'
import { api, AltIs, IsDurum } from '../../lib/api'

/* ── Status mapping: internal → user-facing label ── */
const DURUM_CONFIG: Record<IsDurum, { color: string; dot: string; label: string }> = {
  'Havuzda':       { color: 'bg-sky-50 text-sky-700 border-sky-200',            dot: 'bg-sky-400',     label: 'Beklemede'        },
  'Alındı':        { color: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-400',   label: 'Kurye Yolda'      },
  'Yolda':         { color: 'bg-blue-50 text-blue-700 border-blue-200',          dot: 'bg-blue-500',    label: 'Teslim Sürecinde' },
  'Teslim Edildi': { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Teslim Edildi'    },
  'İptal':         { color: 'bg-red-50 text-red-700 border-red-200',             dot: 'bg-red-400',     label: 'İptal'            },
}

const BOYUT_EMOJI: Record<string, string> = {
  'Zarf': '✉️', 'Küçük': '📦', 'Orta': '🗃️', 'Büyük': '📫', 'Koli': '🏗️',
}

type Filter = IsDurum | 'Tümü'
const FILTERS: Filter[] = ['Tümü', 'Havuzda', 'Alındı', 'Yolda', 'Teslim Edildi', 'İptal']

const FILTER_LABELS: Record<Filter, string> = {
  'Tümü':          'Tümü',
  'Havuzda':       'Beklemede',
  'Alındı':        'Kurye Yolda',
  'Yolda':         'Teslim Sürecinde',
  'Teslim Edildi': 'Teslim Edildi',
  'İptal':         'İptal',
}

function StatusBadge({ durum }: { durum: IsDurum }) {
  const cfg = DURUM_CONFIG[durum] ?? DURUM_CONFIG['Havuzda']
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('tr-TR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function AltIslerim() {
  const [isler, setIsler] = useState<AltIs[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('Tümü')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.alt.islerim()
      setIsler(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = isler.filter(i =>
    filter === 'Tümü' || i.durum === filter
  )

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.olusturma).getTime() - new Date(a.olusturma).getTime()
  )

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Taleplerim</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Yükleniyor...' : `${isler.length} talep`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            title="Yenile"
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link to="/alt/is-olustur" className="btn-primary flex items-center gap-2">
            <Plus size={14} /> Yeni Talep
          </Link>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map(f => {
          const count = f === 'Tümü' ? isler.length : isler.filter(i => i.durum === f).length
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                filter === f
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {FILTER_LABELS[f]}
              {count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  filter === f ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Job list */}
      {loading ? (
        <div className="card py-16 text-center">
          <RefreshCw size={24} className="mx-auto text-gray-300 animate-spin mb-3" />
          <p className="text-sm text-gray-400">Talepler yükleniyor...</p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="card py-16 text-center">
          <Inbox size={36} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-500">
            {filter !== 'Tümü'
              ? `"${FILTER_LABELS[filter]}" durumunda talep yok`
              : 'Henüz talep oluşturmadınız'}
          </p>
          {filter === 'Tümü' && (
            <Link
              to="/alt/is-olustur"
              className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-600 font-semibold hover:underline"
            >
              <Plus size={14} /> İlk talebi oluştur
            </Link>
          )}
          {filter !== 'Tümü' && (
            <button
              onClick={() => setFilter('Tümü')}
              className="mt-3 text-sm text-gray-400 hover:text-gray-600 underline"
            >
              Tüm talepleri göster
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(is => (
            <div key={is.id} className="card p-4 flex items-center gap-4">
              {/* Icon */}
              <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center text-xl shrink-0">
                {BOYUT_EMOJI[is.paket_boyutu] ?? '📦'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-bold text-gray-900">
                    #{String(is.id).padStart(4, '0')}
                  </span>
                  <span className="text-gray-200">·</span>
                  <span className="text-sm text-gray-500">{is.paket_boyutu}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={10} className="shrink-0" />
                  <span>{fmt(is.olusturma)}</span>
                </div>
                {is.aciklama && (
                  <p className="text-xs text-gray-400 mt-1 truncate max-w-xs italic">"{is.aciklama}"</p>
                )}
              </div>

              {/* Status badge */}
              <div className="shrink-0">
                <StatusBadge durum={is.durum} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom hint */}
      {!loading && isler.length > 0 && (
        <p className="text-center text-xs text-gray-400">
          {isler.length} talep &bull; Son güncelleme: {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
    </div>
  )
}
