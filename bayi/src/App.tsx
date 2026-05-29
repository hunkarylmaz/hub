import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Siparisler from './pages/Siparisler'
import Kuryeler from './pages/Kuryeler'
import Restoranlar from './pages/Restoranlar'
import Raporlar from './pages/Raporlar'
import Performanslar from './pages/Performanslar'
import AyarlarLayout from './pages/ayarlar/AyarlarLayout'
import GenelAyarlar from './pages/ayarlar/GenelAyarlar'
import AtamaAyarlari from './pages/ayarlar/AtamaAyarlari'
import BonusAyarlari from './pages/ayarlar/BonusAyarlari'
import MolaYonetim from './pages/ayarlar/MolaYonetim'
import Bildirimler from './pages/ayarlar/Bildirimler'
import Vardiyalar from './pages/ayarlar/Vardiyalar'
import KontorYonetim from './pages/ayarlar/KontorYonetim'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { bayilik, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-primary-600/30 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!bayilik) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { bayilik, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-primary-600/30 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={bayilik ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="siparisler" element={<Siparisler />} />
        <Route path="kuryeler" element={<Kuryeler />} />
        <Route path="restoranlar" element={<Restoranlar />} />
        <Route path="raporlar" element={<Raporlar />} />
        <Route path="performanslar" element={<Performanslar />} />
        <Route path="ayarlar" element={<AyarlarLayout />}>
          <Route index element={<Navigate to="genel" replace />} />
          <Route path="genel" element={<GenelAyarlar />} />
          <Route path="atama" element={<AtamaAyarlari />} />
          <Route path="bonus" element={<BonusAyarlari />} />
          <Route path="mola" element={<MolaYonetim />} />
          <Route path="bildirimler" element={<Bildirimler />} />
          <Route path="vardiyalar" element={<Vardiyalar />} />
          <Route path="kontor" element={<KontorYonetim />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
