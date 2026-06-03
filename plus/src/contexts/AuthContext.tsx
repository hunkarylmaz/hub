import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api, Partner, Tasiyici, Admin } from '../lib/api'

interface AuthCtx {
  partner: Partner | null
  tasiyici: Tasiyici | null
  admin: Admin | null
  loading: boolean
  partnerLogin: (email: string, sifre: string) => Promise<void>
  tasiyiciLogin: (email: string, sifre: string) => Promise<void>
  adminLogin: (email: string, sifre: string) => Promise<void>
  partnerLogout: () => void
  tasiyiciLogout: () => void
  adminLogout: () => void
}

const Ctx = createContext<AuthCtx>(null!)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [partner, setPartner] = useState<Partner | null>(null)
  const [tasiyici, setTasiyici] = useState<Tasiyici | null>(null)
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)

  const loadAll = useCallback(async () => {
    const [p, t, a] = await Promise.all([
      localStorage.getItem('plus_partner_token') ? api.partner.me().catch(() => null) : null,
      localStorage.getItem('plus_tasiyici_token') ? api.tasiyici.me().catch(() => null) : null,
      localStorage.getItem('plus_admin_token') ? api.admin.me().catch(() => null) : null,
    ])
    setPartner(p); setTasiyici(t); setAdmin(a)
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  async function partnerLogin(email: string, sifre: string) {
    const { token } = await api.partner.login(email, sifre)
    localStorage.setItem('plus_partner_token', token)
    setPartner(await api.partner.me())
  }
  async function tasiyiciLogin(email: string, sifre: string) {
    const { token } = await api.tasiyici.login(email, sifre)
    localStorage.setItem('plus_tasiyici_token', token)
    setTasiyici(await api.tasiyici.me())
  }
  async function adminLogin(email: string, sifre: string) {
    const { token } = await api.admin.login(email, sifre)
    localStorage.setItem('plus_admin_token', token)
    setAdmin(await api.admin.me())
  }

  function partnerLogout() { localStorage.removeItem('plus_partner_token'); setPartner(null) }
  function tasiyiciLogout() { localStorage.removeItem('plus_tasiyici_token'); setTasiyici(null) }
  function adminLogout() { localStorage.removeItem('plus_admin_token'); setAdmin(null) }

  return (
    <Ctx.Provider value={{ partner, tasiyici, admin, loading, partnerLogin, tasiyiciLogin, adminLogin, partnerLogout, tasiyiciLogout, adminLogout }}>
      {children}
    </Ctx.Provider>
  )
}
