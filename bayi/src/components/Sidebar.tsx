import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Bike, UtensilsCrossed, Package, BarChart3, TrendingUp, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const navItems = [
  { to: '/',            icon: LayoutDashboard, label: 'Güncel Durum' },
  { to: '/siparisler',  icon: Package,          label: 'Siparişler' },
  { to: '/kuryeler',    icon: Bike,             label: 'Kuryeler' },
  { to: '/restoranlar', icon: UtensilsCrossed,  label: 'Restoranlar' },
  { to: '/raporlar',    icon: BarChart3,        label: 'Raporlar' },
  { to: '/performanslar', icon: TrendingUp,     label: 'Performanslar' },
  { to: '/ayarlar',     icon: Settings,         label: 'Ayarlar' },
]

export default function Sidebar() {
  const { logout, bayilik } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-56 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <Package size={16} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900 leading-tight">Paketçi</p>
            <p className="text-xs text-gray-400 leading-tight">Bayi Paneli</p>
          </div>
        </div>
        {bayilik && (
          <div className="mt-3 px-2.5 py-2 bg-primary-50 rounded-lg">
            <p className="text-xs font-semibold text-primary-600 truncate">{bayilik.ad}</p>
            <p className="text-xs text-gray-400">{bayilik.sehir}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-3 px-3 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-600 border-l-2 border-primary-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={17} />
          Güvenli Çıkış
        </button>
      </div>
    </aside>
  )
}
