import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  MessageSquare,
  Package,
  Tag,
  FileText,
  Star,
  HelpCircle,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Shield,
  User,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'

interface BadgeCounts {
  orders: number
  contacts: number
}

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Siparişler', icon: ShoppingCart, badge: 'orders' },
  { to: '/admin/contacts', label: 'Mesajlar', icon: MessageSquare, badge: 'contacts' },
  { to: '/admin/products', label: 'Ürünler', icon: Package },
  { to: '/admin/pricing', label: 'Fiyatlar', icon: Tag },
  { to: '/admin/content', label: 'Site İçeriği', icon: FileText },
  { to: '/admin/testimonials', label: 'Müşteri Yorumları', icon: Star },
  { to: '/admin/faq', label: 'SSS', icon: HelpCircle },
  { to: '/admin/announcements', label: 'Duyurular', icon: Bell },
  { to: '/admin/settings', label: 'Ayarlar', icon: Settings },
]

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [badges, setBadges] = useState<BadgeCounts>({ orders: 0, contacts: 0 })
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const [ordersRes, contactsRes] = await Promise.all([
          api.get('/orders?status=new&limit=1'),
          api.get('/contacts?status=unread&limit=1'),
        ])
        setBadges({
          orders: ordersRes.data.total || 0,
          contacts: contactsRes.data.total || 0,
        })
      } catch {
        // ignore badge fetch errors
      }
    }
    fetchBadges()
    const interval = setInterval(fetchBadges, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  const getBadgeCount = (badge?: string) => {
    if (!badge) return 0
    return badges[badge as keyof BadgeCounts] || 0
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${
          collapsed ? 'justify-center' : ''
        }`}
      >
        <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-bold text-sm leading-tight">Bir Tıkla</p>
            <p className="text-blue-300 text-xs">e-İmza Yönetim</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const count = getBadgeCount(item.badge)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all group relative ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-blue-200 hover:bg-white/10 hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  {count > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </>
              )}
              {collapsed && count > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {count > 9 ? '9+' : count}
                </span>
              )}
              {/* Tooltip for collapsed */}
              {collapsed && (
                <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
                  {item.label}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* User info at bottom */}
      <div className={`border-t border-white/10 p-3 ${collapsed ? 'flex justify-center' : ''}`}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.username || 'Admin'}</p>
              <p className="text-blue-300 text-xs truncate">{user?.email || ''}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Çıkış Yap"
              className="text-blue-300 hover:text-white transition p-1 rounded"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            title="Çıkış Yap"
            className="text-blue-300 hover:text-white transition p-2 rounded-lg hover:bg-white/10"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-[#0a2569] transition-all duration-300 flex-shrink-0 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-60 bg-[#0a2569] z-50 lg:hidden transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-white/60 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent />
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top navbar */}
        <header className="bg-white border-b border-gray-200 flex items-center gap-4 px-4 h-14 flex-shrink-0 shadow-sm">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700 transition"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <div className="flex-1" />

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
              <div className="w-7 h-7 bg-[#1952d9]/10 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-[#1952d9]" />
              </div>
              <span className="font-medium">{user?.username || 'Admin'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition px-3 py-1.5 rounded-lg hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Çıkış</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
