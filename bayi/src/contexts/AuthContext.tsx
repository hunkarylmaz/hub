import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api, Bayilik } from '../lib/api'

interface AuthContextType {
  bayilik: Bayilik | null
  token: string | null
  loading: boolean
  login: (token: string, bayilik: Bayilik) => void
  logout: () => void
  refreshBayilik: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [bayilik, setBayilik] = useState<Bayilik | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('paketci_bayi_token')
    if (saved) {
      setToken(saved)
      api.auth.me()
        .then(setBayilik)
        .catch(() => localStorage.removeItem('paketci_bayi_token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  function login(newToken: string, newBayilik: Bayilik) {
    localStorage.setItem('paketci_bayi_token', newToken)
    setToken(newToken)
    setBayilik(newBayilik)
  }

  function logout() {
    localStorage.removeItem('paketci_bayi_token')
    setToken(null)
    setBayilik(null)
  }

  async function refreshBayilik() {
    try {
      const b = await api.auth.me()
      setBayilik(b)
    } catch {}
  }

  return (
    <AuthContext.Provider value={{ bayilik, token, loading, login, logout, refreshBayilik }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
