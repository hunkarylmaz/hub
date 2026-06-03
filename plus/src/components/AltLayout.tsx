import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Plus, List, LogOut, ChevronRight, Menu, X, Building2 } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const nav = [
  { to: '/alt/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/alt/is-olustur', icon: Plus,             label: 'Yeni Talep' },
  { to: '/alt/islerim',    icon: List,             label: 'Taleplerim' },
]

export default function AltLayout() {
  const { altKullanici, altLogout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  function logout() { altLogout(); navigate('/alt/login') }

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-white border-r border-gray-100">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-gray-100">
        <span className="text-xl font-black text-gray-900 tracking-tight">
          Rota<span className="text-blue-600">.</span>
        </span>

        {altKullanici && (
          <div className="mt-3 px-3 py-2.5 bg-blue-50 rounded-xl space-y-0.5">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-blue-700 truncate leading-tight">{altKullanici.ad}</p>
            </div>
            {altKullanici.unvan && (
              <p className="text-xs text-blue-500 truncate leading-tight">{altKullanici.unvan}</p>
            )}
            <div className="flex items-center gap-1 mt-1 pt-1 border-t border-blue-100">
              <Building2 size={10} className="text-gray-400 shrink-0" />
              <p className="text-xs text-gray-400 truncate leading-tight">{altKullanici.firma_adi}</p>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={14} className="opacity-60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={16} />
          Çıkış Yap
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-60 flex-col flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="w-60 flex flex-col flex-shrink-0 shadow-xl">
            <Sidebar />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
          <button
            onClick={() => setOpen(o => !o)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="text-lg font-black text-gray-900 tracking-tight">
            Rota<span className="text-blue-600">.</span>
          </span>
          {altKullanici && (
            <span className="ml-auto text-xs text-gray-400 truncate max-w-[140px]">{altKullanici.firma_adi}</span>
          )}
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
