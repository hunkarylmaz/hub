import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Bike, UtensilsCrossed, Package, BarChart3, TrendingUp,
  Settings, LogOut, ChevronDown, Settings2, Sliders, Gift, Clock, Bell,
  CalendarDays, Coins, List, Users, DollarSign, Store, CreditCard, Building2,
  FileText, UserCog, Scale, Map
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const mainNavItems = [
  { to: '/',              icon: LayoutDashboard, label: 'Güncel Durum' },
  { to: '/siparisler',    icon: Package,          label: 'Siparişler' },
  { to: '/kuryeler',      icon: Bike,             label: 'Kuryeler' },
  { to: '/harita',        icon: Map,              label: 'Kurye Haritası' },
  { to: '/restoranlar',   icon: UtensilsCrossed,  label: 'Restoranlar' },
  { to: '/kullanicilar',  icon: UserCog,          label: 'Kullanıcılar' },
]

const raporlarSubItems = [
  { to: '/raporlar/gecmis',              icon: List,       label: 'Geçmiş Siparişler' },
  { to: '/raporlar/kurye-hakedis',       icon: Users,      label: 'Kurye Hakediş' },
  { to: '/raporlar/kurye-odeme',         icon: DollarSign, label: 'Kurye Ödeme Dağılımı' },
  { to: '/raporlar/restoran-hakedis',    icon: Store,      label: 'Restoran Hakediş' },
  { to: '/raporlar/odeme-dagilimi',      icon: CreditCard, label: 'Ödeme Dağılım' },
  { to: '/raporlar/firma',               icon: Building2,  label: 'Firma Hakediş' },
  { to: '/raporlar/kurye-mutabakat',     icon: Scale,      label: 'Kurye Mutabakat' },
  { to: '/raporlar/restoran-mutabakat',  icon: Scale,      label: 'Restoran Mutabakat' },
]

const ayarlarSubItems = [
  { to: '/ayarlar/genel',       icon: Settings2,    label: 'Genel Ayar' },
  { to: '/ayarlar/atama',       icon: Sliders,      label: 'Atama Ayarları' },
  { to: '/ayarlar/bonus',       icon: Gift,         label: 'Bonus Ayarları' },
  { to: '/ayarlar/mola',        icon: Clock,        label: 'Mola Yönetim' },
  { to: '/ayarlar/bildirimler', icon: Bell,         label: 'Bildirimler' },
  { to: '/ayarlar/vardiyalar',  icon: CalendarDays, label: 'Vardiyalar' },
  { to: '/ayarlar/kontor',      icon: Coins,        label: 'Kontör Yönetim' },
]

function ExpandableNav({
  icon: Icon, label, basePath, subItems, location,
}: {
  icon: React.ElementType; label: string; basePath: string
  subItems: { to: string; icon: React.ElementType; label: string }[]
  location: string
}) {
  const isActive = location.startsWith(basePath)
  const [open, setOpen] = useState(isActive)

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-primary-50 text-primary-700 font-semibold border-l-[3px] border-primary-600'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <Icon size={17} />
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-0.5 ml-3 pl-3 border-l border-gray-100 space-y-0.5">
          {subItems.map(({ to, icon: SubIcon, label: subLabel }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`
              }
            >
              <SubIcon size={13} />
              {subLabel}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Sidebar() {
  const { logout, bayilik } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  function handleLogout() { logout(); navigate('/login') }

  return (
    <aside className="w-56 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 shadow-[1px_0_3px_0_rgba(15,23,42,0.03)]">
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-soft">
            <Package size={17} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight tracking-tight">Paketçi</p>
            <p className="text-xs text-gray-400 leading-tight">Bayi Paneli</p>
          </div>
        </div>
        {bayilik && (
          <div className="mt-3 px-2.5 py-2 bg-primary-50/70 border border-primary-100 rounded-lg">
            <p className="text-xs font-semibold text-primary-700 truncate">{bayilik.ad}</p>
            <p className="text-xs text-gray-400">{bayilik.sehir}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
        {mainNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-primary-50 text-primary-700 font-semibold border-l-[3px] border-primary-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}

        {/* Periyodik Rapor */}
        <NavLink
          to="/periyodik-rapor"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              isActive
                ? 'bg-primary-50 text-primary-700 font-semibold border-l-[3px] border-primary-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`
          }
        >
          <FileText size={17} />
          Periyodik Rapor
        </NavLink>

        {/* Raporlar expandable */}
        <ExpandableNav
          icon={BarChart3}
          label="Raporlar"
          basePath="/raporlar"
          subItems={raporlarSubItems}
          location={location.pathname}
        />

        <NavLink
          to="/performanslar"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              isActive
                ? 'bg-primary-50 text-primary-700 font-semibold border-l-[3px] border-primary-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`
          }
        >
          <TrendingUp size={17} />
          Performanslar
        </NavLink>

        {/* Ayarlar expandable */}
        <ExpandableNav
          icon={Settings}
          label="Ayarlar"
          basePath="/ayarlar"
          subItems={ayarlarSubItems}
          location={location.pathname}
        />
      </nav>

      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
        >
          <LogOut size={17} />
          Güvenli Çıkış
        </button>
      </div>
    </aside>
  )
}
