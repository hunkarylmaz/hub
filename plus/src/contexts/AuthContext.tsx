import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api, Partner, Tasiyici } from '../lib/api'

interface AuthCtx {
  partner: Partner | null
  tasiyici: Tasiyici | null
  loading: boolean
  partnerLogin: (email: string, sifre: string) => Promise<void>
  tasiyiciLogin: (email: string, sifre: string) => Promise<void>
  partnerLogout: () => void
  tasiyiciLogout: () => void
}

const Ctx = createContext<AuthCtx>(null!)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [partner, setPartner] = useState<Partner | null>(null)
  const [tasiyici, setTasiyici] = useState<Tasiyici | null>(null)
  const [loading, setLoading] = useState(true)

  const loadBoth = useCallback(async () => {
    const pt = localStorage.getItem('plus_partner_token')
    const tt = localStorage.getItem('plus_tasiyici_token')
    const [p, t] = await Promise.all([
      pt ? api.partner.me().catch(() => null) : Promise.resolve(null),
      tt ? api.tasiyici.me().catch(() => null) : Promise.resolve(null),
    ])
    setPartner(p)
    setTasiyici(t)
    setLoading(false)
  }, [])

  useEffect(() => { loadBoth() }, [loadBoth])

  async function partnerLogin(email: string, sifre: string) {
    const { token } = await api.partner.login(email, sifre)
    localStorage.setItem('plus_partner_token', token)
    const me = await api.partner.me()
    setPartner(me)
  }

  async function tasiyiciLogin(email: string, sifre: string) {
    const { token } = await api.tasiyici.login(email, sifre)
    localStorage.setItem('plus_tasiyici_token', token)
    const me = await api.tasiyici.me()
    setTasiyici(me)
  }

  function partnerLogout() {
    localStorage.removeItem('plus_partner_token')
    setPartner(null)
  }

  function tasiyiciLogout() {
    localStorage.removeItem('plus_tasiyici_token')
    setTasiyici(null)
  }

  return (
    <Ctx.Provider value={{ partner, tasiyici, loading, partnerLogin, tasiyiciLogin, partnerLogout, tasiyiciLogout }}>
      {children}
    </Ctx.Provider>
  )
}
