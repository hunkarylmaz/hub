import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/AuthContext'
import Home from './pages/Home'
import ProductsPage from './pages/ProductsPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import NotFound from './pages/NotFound'
import AdminLogin from './admin/AdminLogin'
import AdminLayout from './admin/AdminLayout'
import AdminDashboard from './admin/AdminDashboard'
import AdminProducts from './admin/AdminProducts'
import AdminOrders from './admin/AdminOrders'
import AdminSettings from './admin/AdminSettings'
import AdminAnnouncements from './admin/AdminAnnouncements'
import AdminTestimonials from './admin/AdminTestimonials'
import AdminFAQ from './admin/AdminFAQ'
import ContactsAdmin from './admin/ContactsAdmin'
import PricingAdmin from './admin/PricingAdmin'
import ContentAdmin from './admin/ContentAdmin'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#1952d9] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Yükleniyor...</p>
        </div>
      </div>
    )
  }
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/urunler" element={<ProductsPage />} />
        <Route path="/hakkimizda" element={<AboutPage />} />
        <Route path="/iletisim" element={<ContactPage />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="contacts" element={<ContactsAdmin />} />
          <Route path="pricing" element={<PricingAdmin />} />
          <Route path="content" element={<ContentAdmin />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="testimonials" element={<AdminTestimonials />} />
          <Route path="faq" element={<AdminFAQ />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  )
}
