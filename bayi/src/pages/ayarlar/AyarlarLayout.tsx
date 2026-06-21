import { Outlet, NavLink } from 'react-router-dom'
import { Settings2, Sliders, Gift, Clock, Bell, CalendarDays, Coins } from 'lucide-react'

const subNav = [
  { to: '/ayarlar/genel',   icon: Settings2,    label: 'Genel Ayar' },
  { to: '/ayarlar/atama',   icon: Sliders,      label: 'Atama Ayarları' },
  { to: '/ayarlar/bonus',   icon: Gift,         label: 'Bonus Ayarları' },
  { to: '/ayarlar/mola',    icon: Clock,        label: 'Mola Yönetim' },
  { to: '/ayarlar/bildirimler', icon: Bell,     label: 'Bildirimler' },
  { to: '/ayarlar/vardiyalar',  icon: CalendarDays, label: 'Vardiyalar' },
  { to: '/ayarlar/kontor',  icon: Coins,        label: 'Kontör Yönetim' },
]

export default function AyarlarLayout() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-gray-800">Ayarlar</h1>
        <p className="text-sm text-gray-500 mt-0.5">Bayi panel ayarları ve konfigürasyonlar</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {subNav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap rounded-t-md transition-all duration-150 ${
                isActive ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <Icon size={14} />
            {label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  )
}
