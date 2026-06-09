import { useEffect, useState } from 'react'
import { Save, AlertCircle, CheckCircle, FileText } from 'lucide-react'
import api from '../lib/api'

interface ContentData {
  // Hero
  hero_title: string
  hero_subtitle: string
  hero_description: string
  hero_cta_text: string
  hero_cta2_text: string
  // About
  about_title: string
  about_description: string
  about_mission: string
  about_vision: string
  // Contact
  contact_phone: string
  contact_email: string
  contact_address: string
  contact_whatsapp: string
  contact_working_hours: string
  // SEO
  seo_meta_title: string
  seo_meta_description: string
  seo_keywords: string
}

const defaultContent: ContentData = {
  hero_title: '',
  hero_subtitle: '',
  hero_description: '',
  hero_cta_text: '',
  hero_cta2_text: '',
  about_title: '',
  about_description: '',
  about_mission: '',
  about_vision: '',
  contact_phone: '',
  contact_email: '',
  contact_address: '',
  contact_whatsapp: '',
  contact_working_hours: '',
  seo_meta_title: '',
  seo_meta_description: '',
  seo_keywords: '',
}

import type { ReactNode } from 'react'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100">
        <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  multiline = false,
  rows = 3,
  placeholder = '',
}: {
  label: string
  value: string
  onChange: (val: string) => void
  type?: string
  multiline?: boolean
  rows?: number
  placeholder?: string
}) {
  const cls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1952d9] text-gray-800"
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={rows}
          className={cls}
          placeholder={placeholder}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={cls}
          placeholder={placeholder}
        />
      )}
    </div>
  )
}

export default function ContentAdmin() {
  const [content, setContent] = useState<ContentData>(defaultContent)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await api.get('/content')
        setContent({ ...defaultContent, ...(res.data || {}) })
      } catch {
        setError('İçerik yüklenirken hata oluştu.')
      } finally {
        setLoading(false)
      }
    }
    fetchContent()
  }, [])

  const set = (key: keyof ContentData) => (val: string) =>
    setContent(prev => ({ ...prev, [key]: val }))

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      await api.put('/content', content)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message || 'Kaydedilirken hata oluştu.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-64">
        <div className="w-8 h-8 border-2 border-[#1952d9] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Site İçeriği</h1>
          <p className="text-gray-500 text-sm mt-0.5">Sayfa metinleri ve içeriklerini yönetin</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#1952d9] hover:bg-[#1544c0] text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60"
        >
          {saving ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Kaydet
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-4 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          İçerik başarıyla kaydedildi.
        </div>
      )}

      <div className="space-y-5">
        <Section title="Hero Bölümü">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Başlık" value={content.hero_title} onChange={set('hero_title')} placeholder="Güvenli ve Hızlı e-İmza Çözümleri" />
            </div>
            <div className="col-span-2">
              <Field label="Alt Başlık" value={content.hero_subtitle} onChange={set('hero_subtitle')} placeholder="Türkiye'nin güvenilir e-İmza sağlayıcısı" />
            </div>
            <div className="col-span-2">
              <Field label="Açıklama" value={content.hero_description} onChange={set('hero_description')} multiline rows={3} placeholder="Kısa açıklama metni..." />
            </div>
            <Field label="Birincil Buton Metni" value={content.hero_cta_text} onChange={set('hero_cta_text')} placeholder="Hemen Başla" />
            <Field label="İkincil Buton Metni" value={content.hero_cta2_text} onChange={set('hero_cta2_text')} placeholder="Daha Fazla Bilgi" />
          </div>
        </Section>

        <Section title="Hakkımızda Bölümü">
          <Field label="Başlık" value={content.about_title} onChange={set('about_title')} placeholder="Hakkımızda" />
          <Field label="Açıklama" value={content.about_description} onChange={set('about_description')} multiline rows={4} placeholder="Şirket hakkında genel bilgi..." />
          <Field label="Misyon" value={content.about_mission} onChange={set('about_mission')} multiline rows={3} placeholder="Misyon metni..." />
          <Field label="Vizyon" value={content.about_vision} onChange={set('about_vision')} multiline rows={3} placeholder="Vizyon metni..." />
        </Section>

        <Section title="İletişim Bilgileri">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Telefon" value={content.contact_phone} onChange={set('contact_phone')} placeholder="+90 212 XXX XX XX" />
            <Field label="E-posta" value={content.contact_email} onChange={set('contact_email')} type="email" placeholder="info@birtiklaeimza.com" />
            <Field label="WhatsApp" value={content.contact_whatsapp} onChange={set('contact_whatsapp')} placeholder="+90 5XX XXX XX XX" />
            <Field label="Çalışma Saatleri" value={content.contact_working_hours} onChange={set('contact_working_hours')} placeholder="Pzt-Cum: 09:00-18:00" />
            <div className="col-span-2">
              <Field label="Adres" value={content.contact_address} onChange={set('contact_address')} multiline rows={2} placeholder="Tam adres..." />
            </div>
          </div>
        </Section>

        <Section title="SEO Ayarları">
          <Field label="Meta Başlık" value={content.seo_meta_title} onChange={set('seo_meta_title')} placeholder="Bir Tıkla e-İmza - Güvenli Elektronik İmza Çözümleri" />
          <Field label="Meta Açıklama" value={content.seo_meta_description} onChange={set('seo_meta_description')} multiline rows={3} placeholder="SEO meta açıklaması (max 160 karakter)" />
          <Field label="Anahtar Kelimeler" value={content.seo_keywords} onChange={set('seo_keywords')} placeholder="e-imza, elektronik imza, güvenli imza, e-devlet imza" />
        </Section>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#1952d9] hover:bg-[#1544c0] text-white px-6 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-60 shadow-sm"
        >
          {saving ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Tüm Değişiklikleri Kaydet
        </button>
      </div>

      {/* Floating save hint */}
      {!loading && (
        <div className="fixed bottom-6 right-6">
          <div className="bg-gray-800/80 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
            <FileText className="w-3.5 h-3.5" />
            Değişiklikleri kaydetmeyi unutmayın
          </div>
        </div>
      )}
    </div>
  )
}
