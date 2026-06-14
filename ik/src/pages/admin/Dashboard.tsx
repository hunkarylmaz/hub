import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, MapPin, Clock, Briefcase, CalendarClock, ArrowRight } from 'lucide-react'
import { api, Stats } from '../../lib/api'

const BASVURU_RENK: Record<string, string> = {
  'Yeni': 'bg-blue-50 text-blue-700',
  'Değerlendiriliyor': 'bg-amber-50 text-amber-700',
  'Olumlu': 'bg-emerald-50 text-emerald-700',
  'Olumsuz': 'bg-red-50 text-red-700',
  'İşe Alındı': 'bg-violet-50 text-violet-700',
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => { api.stats().then(setStats) }, [])

  const cards = [
    { label: 'Toplam Personel', value: stats?.toplam_personel, sub: `${stats?.aktif_personel ?? '—'} aktif`, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Bölge Sayısı',    value: stats?.toplam_bolge,    sub: 'aktif bölge',             icon: MapPin,        color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Bu Hafta Toplam Saat', value: stats ? `${stats.bu_hafta_toplam_saat} sa` : null, sub: 'planlanan çalışma',  icon: Clock,         color: 'text-amber-600',  bg: 'bg-amber-50' },
    { label: 'Yeni Başvuru',    value: stats?.yeni_basvuru,     sub: 'değerlendirme bekliyor',  icon: Briefcase,     color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Bekleyen İzin',   value: stats?.bekleyen_izin,    sub: 'onay bekliyor',           icon: CalendarClock, color: 'text-rose-600',   bg: 'bg-rose-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Genel Bakış</h1>
        <p className="text-sm text-gray-500 mt-0.5">Paketçiniz İK & Vardiya Yönetim Paneli</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            <p className="text-[11px] text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Bölge Bazlı Personel Dağılımı</h2>
            <Link to="/admin/bolgeler" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Bölgeleri Yönet <ArrowRight size={13} />
            </Link>
          </div>
          <div className="space-y-3">
            {stats?.bolge_dagilim.map(b => {
              const max = Math.max(...stats.bolge_dagilim.map(x => x.personel_sayisi), 1)
              return (
                <div key={b.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{b.ad}</span>
                    <span className="text-gray-400">{b.personel_sayisi} personel</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(b.personel_sayisi / max) * 100}%`, backgroundColor: b.renk }} />
                  </div>
                </div>
              )
            })}
            {stats && stats.bolge_dagilim.length === 0 && <p className="text-sm text-gray-400">Henüz bölge tanımlanmadı.</p>}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Son Başvurular</h2>
            <Link to="/admin/basvurular" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Tümünü Gör <ArrowRight size={13} />
            </Link>
          </div>
          <div className="space-y-2">
            {stats?.son_basvurular.map(b => (
              <div key={b.id} className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{b.ad_soyad}</p>
                  <p className="text-xs text-gray-400 truncate">{b.pozisyon} · {b.sehir}</p>
                </div>
                <span className={`badge shrink-0 ${BASVURU_RENK[b.durum] || 'bg-gray-50 text-gray-600'}`}>{b.durum}</span>
              </div>
            ))}
            {stats && stats.son_basvurular.length === 0 && <p className="text-sm text-gray-400">Henüz başvuru yok.</p>}
          </div>
        </div>
      </div>

      <div className="card p-6 bg-gradient-to-r from-gray-800 to-gray-900">
        <div className="flex items-center gap-3 flex-wrap justify-between">
          <div>
            <p className="text-white font-semibold mb-1">Hızlı Erişim</p>
            <p className="text-gray-400 text-sm">Vardiya planlamaya veya personel listesine doğrudan gidin.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/vardiya" className="px-4 py-2.5 rounded-xl bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 transition-colors">Vardiya Planlama</Link>
            <Link to="/admin/personel" className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors">Personel Listesi</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
