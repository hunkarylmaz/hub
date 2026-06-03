import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import PartnerLayout from './components/PartnerLayout'
import TasiyiciLayout from './components/TasiyiciLayout'
import AdminLayout from './components/AdminLayout'
import AltLayout from './components/AltLayout'
import PartnerLogin from './pages/partner/Login'
import Dashboard from './pages/partner/Dashboard'
import IsOlustur from './pages/partner/IsOlustur'
import Islerim from './pages/partner/Islerim'
import IsDetay from './pages/partner/IsDetay'
import AltKullanicilar from './pages/partner/AltKullanicilar'
import TasiyiciLogin from './pages/tasiyici/Login'
import Havuz from './pages/tasiyici/Havuz'
import TasiyiciIslerim from './pages/tasiyici/Islerim'
import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminPartnerler from './pages/admin/Partnerler'
import AdminTasiyicilar from './pages/admin/Tasiyicilar'
import AdminIsler from './pages/admin/Isler'
import AdminFiyatlar from './pages/admin/Fiyatlar'
import AdminBorclar from './pages/admin/Borclar'
import AltLogin from './pages/alt/Login'
import AltDashboard from './pages/alt/Dashboard'
import AltIsOlustur from './pages/alt/IsOlustur'
import AltIslerim from './pages/alt/Islerim'

function RequirePartner({ children }: { children: React.ReactNode }) {
  const { partner, loading } = useAuth()
  if (loading) return <Spinner />
  if (!partner) return <Navigate to="/partner/login" replace />
  return <>{children}</>
}

function RequireTasiyici({ children }: { children: React.ReactNode }) {
  const { tasiyici, loading } = useAuth()
  if (loading) return <Spinner />
  if (!tasiyici) return <Navigate to="/tasiyici/login" replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAuth()
  if (loading) return <Spinner />
  if (!admin) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}

function RequireAlt({ children }: { children: React.ReactNode }) {
  const { altKullanici, loading } = useAuth()
  if (loading) return <Spinner />
  if (!altKullanici) return <Navigate to="/alt/login" replace />
  return <>{children}</>
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )
}

function AppRoutes() {
  const { partner, tasiyici, admin, altKullanici, loading } = useAuth()
  if (loading) return <Spinner />

  return (
    <Routes>
      <Route path="/" element={
        admin        ? <Navigate to="/admin/dashboard" replace /> :
        partner      ? <Navigate to="/partner/dashboard" replace /> :
        tasiyici     ? <Navigate to="/tasiyici/havuz" replace /> :
        altKullanici ? <Navigate to="/alt/dashboard" replace /> :
        <Navigate to="/partner/login" replace />
      } />

      {/* Partner */}
      <Route path="/partner/login" element={partner ? <Navigate to="/partner/dashboard" replace /> : <PartnerLogin />} />
      <Route path="/partner" element={<RequirePartner><PartnerLayout /></RequirePartner>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"        element={<Dashboard />} />
        <Route path="is-olustur"       element={<IsOlustur />} />
        <Route path="islerim"          element={<Islerim />} />
        <Route path="is/:id"           element={<IsDetay />} />
        <Route path="alt-kullanicilar" element={<AltKullanicilar />} />
      </Route>

      {/* Taşıyıcı */}
      <Route path="/tasiyici/login" element={tasiyici ? <Navigate to="/tasiyici/havuz" replace /> : <TasiyiciLogin />} />
      <Route path="/tasiyici" element={<RequireTasiyici><TasiyiciLayout /></RequireTasiyici>}>
        <Route index element={<Navigate to="havuz" replace />} />
        <Route path="havuz"   element={<Havuz />} />
        <Route path="islerim" element={<TasiyiciIslerim />} />
      </Route>

      {/* Admin */}
      <Route path="/admin/login" element={admin ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin />} />
      <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"      element={<AdminDashboard />} />
        <Route path="partnerler"     element={<AdminPartnerler />} />
        <Route path="tasiyicilar"    element={<AdminTasiyicilar />} />
        <Route path="isler"          element={<AdminIsler />} />
        <Route path="fiyatlar"       element={<AdminFiyatlar />} />
        <Route path="borclar"        element={<AdminBorclar />} />
      </Route>

      {/* Alt Kullanıcı */}
      <Route path="/alt/login" element={altKullanici ? <Navigate to="/alt/dashboard" replace /> : <AltLogin />} />
      <Route path="/alt" element={<RequireAlt><AltLayout /></RequireAlt>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"  element={<AltDashboard />} />
        <Route path="is-olustur" element={<AltIsOlustur />} />
        <Route path="islerim"    element={<AltIslerim />} />
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
