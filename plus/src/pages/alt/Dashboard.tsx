import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Package, Clock, CheckCircle2, Plus, ArrowRight,
  Inbox, ChevronRight,
} from 'lucide-react'
import { api, AltIs, IsDurum } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

const DURUM_CONFIG: Record<IsDurum, { color: string; dot: string; label: string }> = {
  'Havuzda':       { color: 'bg-sky-50 text-sky-700 border-sky-200',            dot: 'bg-sky-400',     label: 'Beklemede' },
  'Alındı':        { color: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-400',   label: 'Kurye Yolda' },
  'Yolda':         { color: 'bg-blue-50 text-blue-700 border-blue-200',          dot: 'bg-blue-500',    label: 'Teslim Sürecinde' },
  'Teslim Edildi': { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Teslim Edildi' },
  'İptal':         { color: 'bg-red-50 text-red-700 border-red-200',             dot: 'bg-red-400',     label: 'İptal' },
}

const BOYUT_EMOJI: Record<string, string> = {
  'Zarf': '✉️', 'Küçük': '📦', 'Orta': '🗃️', 'Büyük': '📫', 'Koli': '🏗️',
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
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function AltDashboard() {
  const { altKullanici } = useAuth()
  const [isler, setIsler] = useState<AltIs[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.alt.islerim()
      .then(data => setIsler(data))
      .finally(() => setLoading(false))
  }, [])

  const firstName = altKullanici?.ad?.split(' ')[0] ?? ''

  const stats = {
    toplam:  isler.length,
    bekleyen: isler.filter(i => ['Havuzda', 'Alındı', 'Yolda'].includes(i.durum)).length,
    teslim:  isler.filter(i => i.durum === 'Teslim Edildi').length,
  }

  const recent = [...isler]
    .sort((a, b) => new Date(b.olusturma).getTime() - new Date(a.olusturma).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* ── Welcome banner ── */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">Hoş geldiniz</p>
            <h1 className="text-2xl font-black leading-tight">
              {firstName || altKullanici?.ad || 'Kullanıcı'}
              {altKullanici?.unvan && (
                <span className="ml-2 text-base font-semibold text-blue-200">· {altKullanici.unvan}</span>
              )}
            </h1>
            {altKullanici?.firma_adi && (
              <p className="text-blue-100 text-sm mt-1">{altKullanici.firma_adi}</p>
            )}
          </div>
          <Link
            to="/alt/is-olustur"
            className="shrink-0 flex items-center gap-2 bg-white text-blue-600 px-4 py-2.5 rounded-xl text-sm font-bold shadow hover:bg-blue-50 transition-colors"
          >
            <Plus size={15} />
            Yeni Talep
          </Link>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Toplam Talep', value: stats.toplam,  icon: Package,      color: 'text-gray-600',    bg: 'bg-gray-100' },
          { label: 'Aktif',        value: stats.bekleyen, icon: Clock,        color: 'text-amber-600',   bg: 'bg-amber-50' },
          { label: 'Teslim',       value: stats.teslim,  icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{loading ? '—' : value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Recent jobs ── */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Son Talepler</h2>
          <Link
            to="/alt/islerim"
            className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline"
          >
            Tümünü gör <ArrowRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">Yükleniyor...</div>
        ) : recent.length === 0 ? (
          <div className="py-14 text-center">
            <Inbox size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-500">Henüz talep oluşturmadınız</p>
            <Link
              to="/alt/is-olustur"
              className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-600 font-semibold hover:underline"
            >
              <Plus size={14} /> İlk talebi oluştur
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent.map(is => (
              <div key={is.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-base shrink-0">
                  {BOYUT_EMOJI[is.paket_boyutu] ?? '📦'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">
                      #{String(is.id).padStart(4, '0')}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="text-sm text-gray-500">{is.paket_boyutu}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <Clock size={10} />
                    {fmt(is.olusturma)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge durum={is.durum} />
                  <ChevronRight size={14} className="text-gray-300" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Tip card ── */}
      <div className="card p-5 flex items-start gap-4 border-l-4 border-l-blue-500">
        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
          <Package size={17} className="text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">Nasıl çalışır?</p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            "Yeni Talep" ile gönderi oluşturun. Kurye paketi sizden alır, merkez depoya teslim eder.
            Durumu "Taleplerim" sayfasından takip edebilirsiniz.
          </p>
        </div>
      </div>
    </div>
  )
}
