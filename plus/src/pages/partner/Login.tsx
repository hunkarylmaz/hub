import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function PartnerLogin() {
  const { partnerLogin } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', sifre: '' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await partnerLogin(form.email, form.sifre)
      navigate('/partner/dashboard')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 shadow-lg shadow-primary-200 mb-4">
            <Package size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Paketçiniz <span className="text-primary-600">Plus</span></h1>
          <p className="text-sm text-gray-500 mt-1">Partner Paneli</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Giriş Yap</h2>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">E-posta</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" value={form.email} required
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="firma@email.com"
                  className="input-field pl-10" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Şifre</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={show ? 'text' : 'password'} value={form.sifre} required
                  onChange={e => setForm(f => ({ ...f, sifre: e.target.value }))}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10" />
                <button type="button" onClick={() => setShow(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 flex items-center justify-center gap-2 py-3">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Giriş yapılıyor...</> : 'Giriş Yap'}
            </button>
          </form>
        </div>

        {/* Carrier link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Taşıyıcı mısınız?{' '}
          <a href="/tasiyici/login" className="text-emerald-600 font-semibold hover:underline">Taşıyıcı girişi →</a>
        </p>
      </div>
    </div>
  )
}
