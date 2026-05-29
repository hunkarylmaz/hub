import { Outlet, NavLink } from 'react-router-dom'
import { List, Users, DollarSign, Store, CreditCard, Building2, Scale } from 'lucide-react'

const subNav = [
  { to: '/raporlar/gecmis',              icon: List,        label: 'Geçmiş Siparişler' },
  { to: '/raporlar/kurye-hakedis',       icon: Users,       label: 'Kurye Hakediş' },
  { to: '/raporlar/kurye-odeme',         icon: DollarSign,  label: 'Kurye Ödeme Dağılımı' },
  { to: '/raporlar/restoran-hakedis',    icon: Store,       label: 'Restoran Hakediş' },
  { to: '/raporlar/odeme-dagilimi',      icon: CreditCard,  label: 'Ödeme Dağılım' },
  { to: '/raporlar/firma',               icon: Building2,   label: 'Firma Hakediş' },
  { to: '/raporlar/kurye-mutabakat',     icon: Scale,       label: 'Kurye Mutabakat' },
  { to: '/raporlar/restoran-mutabakat',  icon: Scale,       label: 'Restoran Mutabakat' },
]

export default function RaporlarLayout() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-gray-800">Raporlar</h1>
        <p className="text-sm text-gray-500 mt-0.5">Detaylı hakediş ve analiz raporları</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {subNav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                isActive ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
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
