import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Loader2, ArrowLeft } from 'lucide-react'
import { api } from '../lib/api'

const POZISYONLAR = ['Kurye', 'Bölge Sorumlusu', 'Operasyon Sorumlusu', 'Çağrı Merkezi', 'Depo Personeli', 'Diğer']
const SEHIRLER = ['İzmir', 'Afyonkarahisar', 'Bursa', 'Muğla', 'Osmaniye', 'Kütahya', 'Diğer']

const initial = {
  ad_soyad: '', telefon: '', email: '', pozisyon: '', sehir: '',
  dogum_tarihi: '', ehliyet: '', arac: '', deneyim: '', mesaj: '',
}

export default function Basvuru() {
  const [form, setForm] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  function set<K extends keyof typeof initial>(key: K, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await api.basvuruGonder(form)
      setDone(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Başvurunuz Alındı!</h1>
          <p className="text-sm text-gray-500 mb-6">
            İlginiz için teşekkür ederiz. İK ekibimiz başvurunuzu değerlendirip size en kısa sürede dönüş yapacaktır.
          </p>
          <Link to="/giris" className="btn-secondary inline-flex items-center gap-2">
            <ArrowLeft size={15} /> Giriş ekranına dön
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="paketciniz" className="h-14 w-auto object-contain" />
        </div>
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="px-8 pt-8 pb-6 border-b border-gray-100 text-center">
            <h1 className="text-xl font-bold text-gray-900">Bize Katılın — İş Başvuru Formu</h1>
            <p className="text-sm text-gray-500 mt-1">
              Paketçiniz ailesine katılmak için aşağıdaki formu doldurun, ekibimiz sizinle iletişime geçecektir.
            </p>
          </div>

          <form onSubmit={submit} className="p-8 space-y-4">
            {error && <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ad Soyad *</label>
                <input required value={form.ad_soyad} onChange={e => set('ad_soyad', e.target.value)} className="input-field" placeholder="Adınız Soyadınız" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Telefon *</label>
                <input required value={form.telefon} onChange={e => set('telefon', e.target.value)} className="input-field" placeholder="05XX XXX XX XX" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">E-posta</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input-field" placeholder="ornek@mail.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Doğum Tarihi</label>
                <input type="date" value={form.dogum_tarihi} onChange={e => set('dogum_tarihi', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Başvurulan Pozisyon *</label>
                <select required value={form.pozisyon} onChange={e => set('pozisyon', e.target.value)} className="input-field">
                  <option value="">Seçiniz</option>
                  {POZISYONLAR.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Şehir / Bölge *</label>
                <select required value={form.sehir} onChange={e => set('sehir', e.target.value)} className="input-field">
                  <option value="">Seçiniz</option>
                  {SEHIRLER.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Sürücü Belgesi</label>
                <input value={form.ehliyet} onChange={e => set('ehliyet', e.target.value)} className="input-field" placeholder="Örn: A2, B" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Araç Durumu</label>
                <input value={form.arac} onChange={e => set('arac', e.target.value)} className="input-field" placeholder="Örn: Motosiklet (kendine ait)" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Deneyim</label>
              <input value={form.deneyim} onChange={e => set('deneyim', e.target.value)} className="input-field" placeholder="Önceki iş tecrübeleriniz" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Mesajınız</label>
              <textarea value={form.mesaj} onChange={e => set('mesaj', e.target.value)} className="input-field min-h-[90px]" placeholder="Eklemek istediğiniz notlar..." />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex items-center gap-2 !py-3">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Gönderiliyor...</> : 'Başvuruyu Gönder'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-gray-400 mt-5">
          <Link to="/giris" className="hover:text-gray-600">Yönetici girişi</Link>
        </p>
      </div>
    </div>
  )
}
