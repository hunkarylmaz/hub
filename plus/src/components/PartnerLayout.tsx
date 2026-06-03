import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Plus, List, LogOut, Package, ChevronRight, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const nav = [
  { to: '/partner/dashboard', icon: LayoutDashboard, label: 'Genel Bakış' },
  { to: '/partner/is-olustur', icon: Plus,            label: 'Yeni İş Oluştur' },
  { to: '/partner/islerim',    icon: List,             label: 'İşlerim' },
]

export default function PartnerLayout() {
  const { partner, partnerLogout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  function logout() { partnerLogout(); navigate('/partner/login') }

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-white border-r border-gray-100">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-sm">
            <Package size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">Paketçiniz</p>
            <p className="text-xs font-semibold text-primary-600 leading-tight">Plus</p>
          </div>
        </div>
        {partner && (
          <div className="mt-3 px-3 py-2.5 bg-primary-50 rounded-xl">
            <p className="text-xs font-bold text-primary-700 truncate">{partner.firma_adi}</p>
            <p className="text-xs text-gray-400 truncate">{partner.yetkili_ad}</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }>
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
        <button onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors">
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
          <button onClick={() => setOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
              <Package size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900">Paketçiniz <span className="text-primary-600">Plus</span></span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
