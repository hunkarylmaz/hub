import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Clock, CheckCircle2, XCircle, Plus, ArrowRight, Truck, MapPin } from 'lucide-react'
import { api, Is } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

const DURUM_CONFIG = {
  'Havuzda':       { color: 'bg-sky-50 text-sky-700 border-sky-200',       dot: 'bg-sky-400' },
  'Alındı':        { color: 'bg-amber-50 text-amber-700 border-amber-200',  dot: 'bg-amber-400' },
  'Yolda':         { color: 'bg-blue-50 text-blue-700 border-blue-200',     dot: 'bg-blue-500' },
  'Teslim Edildi': { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  'İptal':         { color: 'bg-red-50 text-red-700 border-red-200',        dot: 'bg-red-400' },
}

function StatusBadge({ durum }: { durum: string }) {
  const cfg = DURUM_CONFIG[durum as keyof typeof DURUM_CONFIG] || DURUM_CONFIG['Havuzda']
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {durum}
    </span>
  )
}

export default function Dashboard() {
  const { partner } = useAuth()
  const [isler, setIsler] = useState<Is[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.partner.islerim().then(d => setIsler(d)).finally(() => setLoading(false))
  }, [])

  const stats = {
    havuzda:  isler.filter(i => i.durum === 'Havuzda').length,
    aktif:    isler.filter(i => ['Alındı','Yolda'].includes(i.durum)).length,
    teslim:   isler.filter(i => i.durum === 'Teslim Edildi').length,
    iptal:    isler.filter(i => i.durum === 'İptal').length,
  }

  const recent = [...isler].sort((a, b) => new Date(b.olusturma).getTime() - new Date(a.olusturma).getTime()).slice(0, 5)

  const BOYUT_ICON: Record<string, string> = { 'Zarf':'✉️', 'Küçük':'📦', 'Orta':'📦', 'Büyük':'📦', 'Koli':'🗃️' }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Merhaba, {partner?.yetkili_ad?.split(' ')[0]} 👋</h1>
          <p className="text-sm text-gray-500 mt-0.5">{partner?.firma_adi} — işlerinizi buradan yönetin</p>
        </div>
        <Link to="/partner/is-olustur" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Yeni İş
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Havuzda Bekliyor', value: stats.havuzda, icon: Clock,         color: 'text-sky-600',     bg: 'bg-sky-50' },
          { label: 'Aktif Taşıma',     value: stats.aktif,   icon: Truck,         color: 'text-blue-600',    bg: 'bg-blue-50' },
          { label: 'Teslim Edildi',    value: stats.teslim,  icon: CheckCircle2,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'İptal',            value: stats.iptal,   icon: XCircle,       color: 'text-red-500',     bg: 'bg-red-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{loading ? '—' : value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent jobs */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Son İşler</h2>
          <Link to="/partner/islerim" className="text-xs text-primary-600 font-semibold flex items-center gap-1 hover:underline">
            Tümünü gör <ArrowRight size={12} />
          </Link>
        </div>
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">Yükleniyor...</div>
        ) : recent.length === 0 ? (
          <div className="py-12 text-center">
            <Package size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">Henüz iş oluşturmadınız</p>
            <Link to="/partner/is-olustur" className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary-600 font-semibold hover:underline">
              <Plus size={14} /> İlk işi oluştur
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent.map(is => (
              <Link key={is.id} to={`/partner/is/${is.id}`}
                className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-lg shrink-0">
                  {BOYUT_ICON[is.paket_boyutu] || '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800">
                      #{String(is.id).padStart(4,'0')}
                    </p>
                    <span className="text-gray-300">·</span>
                    <p className="text-sm text-gray-600">{is.paket_boyutu}</p>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                    <MapPin size={11} />
                    <span className="truncate">{is.alis_il}/{is.alis_ilce} → {is.birakilis_il}/{is.birakilis_ilce}</span>
                  </div>
                </div>
                <StatusBadge durum={is.durum} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick tip */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Package size={20} className="text-white" />
          </div>
          <div>
            <p className="font-semibold">Nasıl çalışır?</p>
            <p className="text-sm text-primary-100 mt-1">
              İş oluşturduğunuzda havuza düşer. Taşıyıcılar QR kodu ile paketi teslim alır ve bırakılma noktasına iletir. Anlık durum takibi yapabilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
