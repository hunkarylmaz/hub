import { useState, FormEvent } from 'react'
import { Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'

export default function Ayarlar() {
  const { admin } = useAuth()
  const [form, setForm] = useState({ eski_sifre: '', yeni_sifre: '', yeni_sifre2: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(''); setSuccess(false)
    if (form.yeni_sifre !== form.yeni_sifre2) { setError('Yeni şifreler eşleşmiyor'); return }
    if (form.yeni_sifre.length < 6) { setError('Yeni şifre en az 6 karakter olmalı'); return }
    setLoading(true)
    try {
      await api.sifreDegistir(form.eski_sifre, form.yeni_sifre)
      setSuccess(true)
      setForm({ eski_sifre: '', yeni_sifre: '', yeni_sifre2: '' })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
        <p className="text-sm text-gray-500 mt-0.5">Hesap bilgilerinizi ve güvenlik ayarlarınızı yönetin.</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <ShieldCheck size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="font-bold text-gray-900">{admin?.ad}</p>
            <p className="text-xs text-gray-400">{admin?.email}</p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-bold text-gray-900 mb-4">Şifre Değiştir</h2>
        {error && <div className="mb-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}
        {success && (
          <div className="mb-3 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700 flex items-center gap-2">
            <CheckCircle2 size={15} /> Şifreniz başarıyla güncellendi.
          </div>
        )}
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Mevcut Şifre</label>
            <input type="password" required value={form.eski_sifre} onChange={e => setForm(f => ({ ...f, eski_sifre: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Yeni Şifre</label>
            <input type="password" required value={form.yeni_sifre} onChange={e => setForm(f => ({ ...f, yeni_sifre: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Yeni Şifre (Tekrar)</label>
            <input type="password" required value={form.yeni_sifre2} onChange={e => setForm(f => ({ ...f, yeni_sifre2: e.target.value }))} className="input-field" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-1.5">
            {loading ? <Loader2 size={14} className="animate-spin" /> : null} Şifreyi Güncelle
          </button>
        </form>
      </div>
    </div>
  )
}
