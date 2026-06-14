import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', sifre: '' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    try { await login(form.email, form.sifre); navigate('/admin/dashboard') }
    catch (err) { setError((err as Error).message) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-blue-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="px-8 pt-8 pb-6 text-center border-b border-gray-100">
            <div className="flex justify-center mb-4">
              <img src="/logo.png" alt="paketciniz" className="h-14 w-auto object-contain" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">İK & Vardiya Yönetim Paneli</h1>
            <p className="text-sm text-gray-400 mt-1">Yetkili girişi yapınız</p>
          </div>

          <form onSubmit={submit} className="p-8 space-y-4">
            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">E-posta</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" required value={form.email} placeholder="ornek@paketciniz.com"
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input-field pl-10" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Şifre</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={show ? 'text' : 'password'} required value={form.sifre} placeholder="••••••••"
                  onChange={e => setForm(f => ({ ...f, sifre: e.target.value }))}
                  className="input-field pl-10 pr-10" />
                <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex items-center gap-2 !py-3">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Giriş yapılıyor...</> : 'Giriş Yap'}
            </button>
            <div className="flex items-center gap-2 justify-center text-xs text-gray-400 pt-1">
              <ShieldCheck size={13} /> Yetki bazlı, güvenli erişim
            </div>
          </form>
        </div>
        <p className="text-center text-xs text-gray-500 mt-5">
          İş başvurusu yapmak ister misiniz? <Link to="/basvuru" className="text-blue-400 hover:text-blue-300 font-semibold">Başvuru formuna git</Link>
        </p>
      </div>
    </div>
  )
}
