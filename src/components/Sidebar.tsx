import { NavLink } from 'react-router-dom'
import { LayoutGrid, CreditCard, History, BarChart3, Settings, LogOut } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Bayiliklerim', icon: LayoutGrid, end: true },
  { to: '/odeme-talepleri', label: 'Ödeme Taleplerim', icon: CreditCard },
  { to: '/kontor-gecmisi', label: 'Kontör Geçmişi', icon: History },
  { to: '/raporlar', label: 'Raporlar', icon: BarChart3 },
  { to: '/ayarlar', label: 'Ayarlar', icon: Settings },
]

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-100 flex flex-col relative overflow-hidden">
      <nav className="flex-1 pt-4 pb-4">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors relative ${
                isActive
                  ? 'bg-primary-50 text-primary-600 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary-600 before:rounded-r'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-100 pt-2 pb-4">
        <button className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 w-full transition-colors">
          <LogOut size={18} />
          Güvenli Çıkış
        </button>
      </div>

      {/* Decorative gradient blob */}
      <div
        className="absolute bottom-0 left-0 w-full h-40 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 30% 100%, rgba(124,58,237,0.12) 0%, rgba(167,139,250,0.06) 50%, transparent 80%)',
        }}
      />
    </aside>
  )
}
