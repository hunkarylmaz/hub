import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Logo from '../../components/Logo'

export default function AdminLogin() {
  const { adminLogin } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', sifre: '' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    try { await adminLogin(form.email, form.sifre); navigate('/admin/dashboard') }
    catch (err) { setError((err as Error).message) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo dark size="lg" />
          <p className="text-gray-400 text-sm mt-3">Yönetim Paneli</p>
        </div>
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8">
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck size={18} className="text-amber-400" />
            <h2 className="text-white font-semibold">Admin Girişi</h2>
          </div>
          {error && <div className="mb-4 px-4 py-3 bg-red-900/30 border border-red-700 rounded-xl text-sm text-red-400">{error}</div>}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">E-posta</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="email" value={form.email} required
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Şifre</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type={show ? 'text' : 'password'} value={form.sifre} required
                  onChange={e => setForm(f => ({ ...f, sifre: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 text-gray-900 font-bold rounded-xl hover:bg-amber-400 transition-colors disabled:opacity-50">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Giriş...</> : 'Giriş Yap'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
