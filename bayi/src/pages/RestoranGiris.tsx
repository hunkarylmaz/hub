import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Store, Loader2, AlertCircle } from 'lucide-react'
import { api } from '../lib/api'
import { useRestoranAuth } from '../contexts/RestoranAuthContext'

export default function RestoranGiris() {
  const { login } = useRestoranAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [sifre, setSifre] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, restoran } = await api.restoranPortal.auth.login(email, sifre)
      login(token, restoran)
      navigate('/restoran', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-200/40 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-20 w-[28rem] h-[28rem] bg-primary-100/60 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10 px-4">
        <div className="bg-white rounded-2xl shadow-popover border border-gray-100 p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center mb-4 shadow-card-hover">
              <Store size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Restoran Sipariş Girişi</h1>
            <p className="text-sm text-gray-500 mt-1">İşletme hesabınızla giriş yapın</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="restoran@isletme.app"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm transition-shadow duration-150 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Şifre</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={sifre}
                  onChange={e => setSifre(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm transition-shadow duration-150 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-sm mt-2"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">
          Paketçi Restoran Paneli · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
