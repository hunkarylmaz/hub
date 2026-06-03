import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import PartnerLayout from './components/PartnerLayout'
import TasiyiciLayout from './components/TasiyiciLayout'
import PartnerLogin from './pages/partner/Login'
import Dashboard from './pages/partner/Dashboard'
import IsOlustur from './pages/partner/IsOlustur'
import Islerim from './pages/partner/Islerim'
import IsDetay from './pages/partner/IsDetay'
import TasiyiciLogin from './pages/tasiyici/Login'
import Havuz from './pages/tasiyici/Havuz'
import TasiyiciIslerim from './pages/tasiyici/Islerim'

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

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  )
}

function AppRoutes() {
  const { partner, tasiyici, loading } = useAuth()
  if (loading) return <Spinner />

  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={
        partner ? <Navigate to="/partner/dashboard" replace /> :
        tasiyici ? <Navigate to="/tasiyici/havuz" replace /> :
        <Navigate to="/partner/login" replace />
      } />

      {/* Partner */}
      <Route path="/partner/login" element={partner ? <Navigate to="/partner/dashboard" replace /> : <PartnerLogin />} />
      <Route path="/partner" element={<RequirePartner><PartnerLayout /></RequirePartner>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"   element={<Dashboard />} />
        <Route path="is-olustur"  element={<IsOlustur />} />
        <Route path="islerim"     element={<Islerim />} />
        <Route path="is/:id"      element={<IsDetay />} />
      </Route>

      {/* Tasiyici */}
      <Route path="/tasiyici/login" element={tasiyici ? <Navigate to="/tasiyici/havuz" replace /> : <TasiyiciLogin />} />
      <Route path="/tasiyici" element={<RequireTasiyici><TasiyiciLayout /></RequireTasiyici>}>
        <Route index element={<Navigate to="havuz" replace />} />
        <Route path="havuz"   element={<Havuz />} />
        <Route path="islerim" element={<TasiyiciIslerim />} />
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
