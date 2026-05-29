import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Bayiliklerim from './pages/Bayiliklerim'
import OdemeTaleplerim from './pages/OdemeTaleplerim'
import KontorGecmisi from './pages/KontorGecmisi'
import Raporlar from './pages/Raporlar'
import Ayarlar from './pages/Ayarlar'
import Kullanicilar from './pages/Kullanicilar'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-primary-600/30 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { user, loading } = useAuth()

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
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Bayiliklerim />} />
        <Route path="odeme-talepleri" element={<OdemeTaleplerim />} />
        <Route path="kontor-gecmisi" element={<KontorGecmisi />} />
        <Route path="raporlar" element={<Raporlar />} />
        <Route path="ayarlar" element={<Ayarlar />} />
        <Route path="kullanicilar" element={<Kullanicilar />} />
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
