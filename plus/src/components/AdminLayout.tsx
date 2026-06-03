import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Truck, List, Tag, CreditCard, LogOut, ChevronRight, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const nav = [
  { to: '/admin/dashboard',       icon: LayoutDashboard, label: 'Genel Bakış' },
  { to: '/admin/partnerler',      icon: Users,           label: 'Partnerler' },
  { to: '/admin/tasiyicilar',     icon: Truck,           label: 'Taşıyıcılar' },
  { to: '/admin/isler',           icon: List,            label: 'İşler' },
  { to: '/admin/fiyatlar',        icon: Tag,             label: 'Fiyat Tablosu' },
  { to: '/admin/borclar',         icon: CreditCard,      label: 'Borç Takibi' },
  { to: '/admin/alt-kullanicilar',icon: Users,           label: 'Alt Kullanıcılar' },
]

export default function AdminLayout() {
  const { admin, adminLogout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  function logout() { adminLogout(); navigate('/admin/login') }

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-white border-r border-gray-100">
      <div className="px-6 py-5 border-b border-gray-100">
        <span className="text-xl font-black text-gray-900">Rota<span className="text-blue-600">.</span></span>
        <p className="text-[10px] text-gray-400 font-medium mt-0.5">YÖNETİM PANELİ</p>
        {admin && (
          <div className="mt-3 px-3 py-2.5 bg-blue-50 rounded-xl">
            <p className="text-xs font-bold text-blue-700 truncate">{admin.ad}</p>
            <p className="text-xs text-gray-400 truncate">Admin</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }>
            {({ isActive }) => (
              <>
                <Icon size={16} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={13} className="opacity-40" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <button onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
          <LogOut size={16} /> Çıkış Yap
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="hidden md:flex w-60 flex-col flex-shrink-0">
        <Sidebar />
      </div>
      {open && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="w-60 flex flex-col flex-shrink-0 shadow-xl"><Sidebar /></div>
          <div className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
          <button onClick={() => setOpen(o => !o)} className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="text-xl font-black text-gray-900">Rota<span className="text-blue-600">.</span></span>
        </div>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
