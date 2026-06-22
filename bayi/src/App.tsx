import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { RestoranAuthProvider, useRestoranAuth } from './contexts/RestoranAuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import RestoranGiris from './pages/RestoranGiris'
import RestoranPortal from './pages/RestoranPortal'
import Dashboard from './pages/Dashboard'
import Siparisler from './pages/Siparisler'
import Kuryeler from './pages/Kuryeler'
import Restoranlar from './pages/Restoranlar'
import PeriyodikRapor from './pages/PeriyodikRapor'
import Performanslar from './pages/Performanslar'
import AyarlarLayout from './pages/ayarlar/AyarlarLayout'
import GenelAyarlar from './pages/ayarlar/GenelAyarlar'
import AtamaAyarlari from './pages/ayarlar/AtamaAyarlari'
import BonusAyarlari from './pages/ayarlar/BonusAyarlari'
import MolaYonetim from './pages/ayarlar/MolaYonetim'
import Bildirimler from './pages/ayarlar/Bildirimler'
import Vardiyalar from './pages/ayarlar/Vardiyalar'
import KontorYonetim from './pages/ayarlar/KontorYonetim'
import RaporlarLayout from './pages/raporlar/RaporlarLayout'
import GecmisSiparisler from './pages/raporlar/GecmisSiparisler'
import KuryeHakedis from './pages/raporlar/KuryeHakedis'
import KuryeOdemeDagilimi from './pages/raporlar/KuryeOdemeDagilimi'
import RestoranHakedis from './pages/raporlar/RestoranHakedis'
import OdemeDagilimi from './pages/raporlar/OdemeDagilimi'
import FirmaHakedis from './pages/raporlar/FirmaHakedis'
import KuryeMutabakat from './pages/raporlar/KuryeMutabakat'
import RestoranMutabakat from './pages/raporlar/RestoranMutabakat'
import Kullanicilar from './pages/Kullanicilar'
import KuryeHarita from './pages/KuryeHarita'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { bayilik, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-8 h-8 border-4 border-primary-600/30 border-t-primary-600 rounded-full animate-spin" /></div>
  if (!bayilik) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireRestoranAuth({ children }: { children: React.ReactNode }) {
  const { restoran, loading } = useRestoranAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-8 h-8 border-4 border-primary-600/30 border-t-primary-600 rounded-full animate-spin" /></div>
  if (!restoran) return <Navigate to="/restoran-girisi" replace />
  return <>{children}</>
}

function RestoranGirisRoute() {
  const { restoran, loading } = useRestoranAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-8 h-8 border-4 border-primary-600/30 border-t-primary-600 rounded-full animate-spin" /></div>
  return restoran ? <Navigate to="/restoran" replace /> : <RestoranGiris />
}

function AppRoutes() {
  const { bayilik, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-8 h-8 border-4 border-primary-600/30 border-t-primary-600 rounded-full animate-spin" /></div>

  return (
    <Routes>
      <Route path="/login" element={bayilik ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<Dashboard />} />
        <Route path="siparisler" element={<Siparisler />} />
        <Route path="kuryeler" element={<Kuryeler />} />
        <Route path="restoranlar" element={<Restoranlar />} />
        <Route path="kullanicilar" element={<Kullanicilar />} />
        <Route path="harita" element={<KuryeHarita />} />
        <Route path="periyodik-rapor" element={<PeriyodikRapor />} />
        <Route path="raporlar" element={<RaporlarLayout />}>
          <Route index element={<Navigate to="gecmis" replace />} />
          <Route path="gecmis" element={<GecmisSiparisler />} />
          <Route path="kurye-hakedis" element={<KuryeHakedis />} />
          <Route path="kurye-odeme" element={<KuryeOdemeDagilimi />} />
          <Route path="restoran-hakedis" element={<RestoranHakedis />} />
          <Route path="odeme-dagilimi" element={<OdemeDagilimi />} />
          <Route path="firma" element={<FirmaHakedis />} />
          <Route path="kurye-mutabakat" element={<KuryeMutabakat />} />
          <Route path="restoran-mutabakat" element={<RestoranMutabakat />} />
        </Route>
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
      <Route path="/restoran-girisi" element={<RestoranGirisRoute />} />
      <Route path="/restoran" element={<RequireRestoranAuth><RestoranPortal /></RequireRestoranAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RestoranAuthProvider>
          <AppRoutes />
        </RestoranAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
