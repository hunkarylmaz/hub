import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, Truck, ShieldCheck, Clock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const FEATURES = [
  { icon: Truck,        text: 'Anlık teslimat takibi'     },
  { icon: ShieldCheck,  text: 'Güvenli ve hızlı gönderi'  },
  { icon: Clock,        text: 'Kolay talep oluşturma'     },
]

export default function AltLogin() {
  const { altLogin } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', sifre: '' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await altLogin(form.email, form.sifre)
      navigate('/alt/dashboard')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-1/2 bg-blue-600 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute bottom-16 -left-20 w-72 h-72 rounded-full bg-white/5" />
          <div className="absolute top-1/2 right-12 w-36 h-36 rounded-full bg-white/5" />
        </div>

        {/* Brand */}
        <div className="relative">
          <span className="text-3xl font-black text-white tracking-tight">
            Rota<span className="text-blue-200">.</span>
          </span>
        </div>

        {/* Copy */}
        <div className="relative space-y-8">
          <div>
            <h1 className="text-4xl font-black text-white leading-snug mb-4">
              Gönderilerinizi<br />kolayca yönetin
            </h1>
            <p className="text-blue-100 text-base leading-relaxed max-w-xs">
              Yeni talep oluşturun, sürecini anlık takip edin — her şey tek ekranda.
            </p>
          </div>

          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-white" />
                </div>
                <span className="text-sm text-blue-100">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-blue-300 text-xs relative">
          Alt kullanıcı portali &bull; Rota Lojistik
        </p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden mb-8 text-center">
            <span className="text-3xl font-black text-gray-900 tracking-tight">
              Rota<span className="text-blue-600">.</span>
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Giriş Yap</h2>
            <p className="text-sm text-gray-500 mt-1">
              Hesabınıza erişmek için bilgilerinizi girin.
            </p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-start gap-2.5">
              <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold leading-none">!</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                E-posta adresi
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  value={form.email}
                  required
                  autoComplete="email"
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="ad@firma.com"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Şifre
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type={show ? 'text' : 'password'}
                  value={form.sifre}
                  required
                  autoComplete="current-password"
                  onChange={e => setForm(f => ({ ...f, sifre: e.target.value }))}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 flex items-center justify-center gap-2 py-3 text-base"
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Giriş yapılıyor...
                </>
              ) : (
                <>
                  Giriş Yap
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            Hesabınız yoksa lütfen firmanızla iletişime geçin.
          </p>
        </div>
      </div>
    </div>
  )
}
