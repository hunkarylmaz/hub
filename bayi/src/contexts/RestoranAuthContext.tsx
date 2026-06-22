import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api, RestoranOturum } from '../lib/api'

interface RestoranAuthContextType {
  restoran: RestoranOturum | null
  loading: boolean
  login: (token: string, restoran: RestoranOturum) => void
  logout: () => void
  refreshRestoran: () => Promise<void>
}

const RestoranAuthContext = createContext<RestoranAuthContextType>(null!)

export function RestoranAuthProvider({ children }: { children: ReactNode }) {
  const [restoran, setRestoran] = useState<RestoranOturum | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('paketci_restoran_token')
    if (saved) {
      api.restoranPortal.auth.me()
        .then(setRestoran)
        .catch(() => localStorage.removeItem('paketci_restoran_token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  function login(token: string, r: RestoranOturum) {
    localStorage.setItem('paketci_restoran_token', token)
    setRestoran(r)
  }

  function logout() {
    localStorage.removeItem('paketci_restoran_token')
    setRestoran(null)
  }

  async function refreshRestoran() {
    try {
      const r = await api.restoranPortal.auth.me()
      setRestoran(r)
    } catch {}
  }

  return (
    <RestoranAuthContext.Provider value={{ restoran, loading, login, logout, refreshRestoran }}>
      {children}
    </RestoranAuthContext.Provider>
  )
}

export function useRestoranAuth() {
  return useContext(RestoranAuthContext)
}
