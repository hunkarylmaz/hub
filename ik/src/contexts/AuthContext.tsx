import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api, Admin } from '../lib/api'

interface AuthCtx {
  admin: Admin | null
  loading: boolean
  login: (email: string, sifre: string) => Promise<void>
  logout: () => void
}

const Ctx = createContext<AuthCtx>(null!)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!localStorage.getItem('ik_admin_token')) { setLoading(false); return }
    try { setAdmin(await api.me()) }
    catch { localStorage.removeItem('ik_admin_token'); setAdmin(null) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function login(email: string, sifre: string) {
    const { token } = await api.login(email, sifre)
    localStorage.setItem('ik_admin_token', token)
    setAdmin(await api.me())
  }

  function logout() {
    localStorage.removeItem('ik_admin_token')
    setAdmin(null)
  }

  return <Ctx.Provider value={{ admin, loading, login, logout }}>{children}</Ctx.Provider>
}
