import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api, User } from '../lib/api'

interface AuthContextValue {
  user: User | null
  token: string | null
  login: (email: string, sifre: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('paketci_token')
    if (storedToken) {
      setToken(storedToken)
      api.auth
        .me()
        .then((u) => setUser(u))
        .catch(() => {
          localStorage.removeItem('paketci_token')
          setToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  async function login(email: string, sifre: string): Promise<void> {
    const result = await api.auth.login(email, sifre)
    localStorage.setItem('paketci_token', result.token)
    setToken(result.token)
    setUser(result.user)
  }

  function logout() {
    localStorage.removeItem('paketci_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
