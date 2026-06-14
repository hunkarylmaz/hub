import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AdminLayout from './components/AdminLayout'
import Login from './pages/Login'
import Basvuru from './pages/Basvuru'
import Dashboard from './pages/admin/Dashboard'
import VardiyaPlanlama from './pages/admin/VardiyaPlanlama'
import Personel from './pages/admin/Personel'
import Bolgeler from './pages/admin/Bolgeler'
import Basvurular from './pages/admin/Basvurular'
import Izinler from './pages/admin/Izinler'
import Duyurular from './pages/admin/Duyurular'
import Ayarlar from './pages/admin/Ayarlar'

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAuth()
  if (loading) return <Spinner />
  if (!admin) return <Navigate to="/giris" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { admin, loading } = useAuth()
  if (loading) return <Spinner />

  return (
    <Routes>
      <Route path="/" element={<Navigate to={admin ? '/admin/dashboard' : '/giris'} replace />} />
      <Route path="/giris" element={admin ? <Navigate to="/admin/dashboard" replace /> : <Login />} />
      <Route path="/basvuru" element={<Basvuru />} />

      <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"  element={<Dashboard />} />
        <Route path="vardiya"    element={<VardiyaPlanlama />} />
        <Route path="personel"   element={<Personel />} />
        <Route path="bolgeler"   element={<Bolgeler />} />
        <Route path="basvurular" element={<Basvurular />} />
        <Route path="izinler"    element={<Izinler />} />
        <Route path="duyurular"  element={<Duyurular />} />
        <Route path="ayarlar"    element={<Ayarlar />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
