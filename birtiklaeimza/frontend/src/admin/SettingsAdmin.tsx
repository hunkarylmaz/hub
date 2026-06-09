import React, { useEffect, useState } from 'react'
import { Save, AlertCircle, CheckCircle } from 'lucide-react'
import api from '../lib/api'

interface Settings {
  // Genel
  site_title: string
  logo_text: string
  tagline: string
  // İletişim
  phone: string
  phone2: string
  email: string
  email2: string
  address: string
  whatsapp: string
  // Sosyal Medya
  facebook: string
  twitter: string
  instagram: string
  linkedin: string
  youtube: string
  // SEO
  meta_description: string
  keywords: string
  google_analytics_id: string
}

const defaultSettings: Settings = {
  site_title: '',
  logo_text: '',
  tagline: '',
  phone: '',
  phone2: '',
  email: '',
  email2: '',
  address: '',
  whatsapp: '',
  facebook: '',
  twitter: '',
  instagram: '',
  linkedin: '',
  youtube: '',
  meta_description: '',
  keywords: '',
  google_analytics_id: '',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
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
  placeholder = '',
  hint = '',
}: {
  label: string
  value: string
  onChange: (val: string) => void
  type?: string
  placeholder?: string
  hint?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1952d9] text-gray-800"
      />
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder = '',
  rows = 3,
}: {
  label: string
  value: string
  onChange: (val: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1952d9] text-gray-800"
      />
    </div>
  )
}

export default function SettingsAdmin() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings')
        setSettings({ ...defaultSettings, ...(res.data || {}) })
      } catch {
        setError('Ayarlar yüklenirken hata oluştu.')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const set = (key: keyof Settings) => (val: string) =>
    setSettings(prev => ({ ...prev, [key]: val }))

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      await api.put('/settings', settings)
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
          <h1 className="text-2xl font-bold text-gray-800">Site Ayarları</h1>
          <p className="text-gray-500 text-sm mt-0.5">Genel site ayarlarını yönetin</p>
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
          Ayarlar başarıyla kaydedildi.
        </div>
      )}

      <div className="space-y-5">
        <Section title="Genel Ayarlar">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Site Başlığı" value={settings.site_title} onChange={set('site_title')} placeholder="Bir Tıkla e-İmza" />
            <Field label="Logo Metni" value={settings.logo_text} onChange={set('logo_text')} placeholder="Bir Tıkla" />
            <div className="col-span-2">
              <Field label="Slogan" value={settings.tagline} onChange={set('tagline')} placeholder="Güvenli ve Hızlı e-İmza Çözümleri" />
            </div>
          </div>
        </Section>

        <Section title="İletişim Bilgileri">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Telefon 1" value={settings.phone} onChange={set('phone')} placeholder="+90 212 XXX XX XX" type="tel" />
            <Field label="Telefon 2" value={settings.phone2} onChange={set('phone2')} placeholder="+90 212 XXX XX XX" type="tel" />
            <Field label="E-posta 1" value={settings.email} onChange={set('email')} placeholder="info@birtiklaeimza.com" type="email" />
            <Field label="E-posta 2" value={settings.email2} onChange={set('email2')} placeholder="destek@birtiklaeimza.com" type="email" />
            <Field label="WhatsApp" value={settings.whatsapp} onChange={set('whatsapp')} placeholder="+90 5XX XXX XX XX" type="tel" />
            <div className="col-span-2">
              <TextAreaField label="Adres" value={settings.address} onChange={set('address')} placeholder="Tam adres bilgisi..." rows={2} />
            </div>
          </div>
        </Section>

        <Section title="Sosyal Medya">
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Facebook"
              value={settings.facebook}
              onChange={set('facebook')}
              placeholder="https://facebook.com/birtiklaeimza"
              hint="Tam URL giriniz"
            />
            <Field
              label="Twitter / X"
              value={settings.twitter}
              onChange={set('twitter')}
              placeholder="https://twitter.com/birtiklaeimza"
            />
            <Field
              label="Instagram"
              value={settings.instagram}
              onChange={set('instagram')}
              placeholder="https://instagram.com/birtiklaeimza"
            />
            <Field
              label="LinkedIn"
              value={settings.linkedin}
              onChange={set('linkedin')}
              placeholder="https://linkedin.com/company/birtiklaeimza"
            />
            <Field
              label="YouTube"
              value={settings.youtube}
              onChange={set('youtube')}
              placeholder="https://youtube.com/@birtiklaeimza"
            />
          </div>
        </Section>

        <Section title="SEO Ayarları">
          <TextAreaField
            label="Meta Açıklama"
            value={settings.meta_description}
            onChange={set('meta_description')}
            placeholder="Arama motorlarında görünecek açıklama metni (max 160 karakter)"
            rows={3}
          />
          <Field
            label="Anahtar Kelimeler"
            value={settings.keywords}
            onChange={set('keywords')}
            placeholder="e-imza, elektronik imza, güvenli imza"
            hint="Virgülle ayırınız"
          />
          <Field
            label="Google Analytics ID"
            value={settings.google_analytics_id}
            onChange={set('google_analytics_id')}
            placeholder="G-XXXXXXXXXX"
            hint="Google Analytics 4 ölçüm kimliği"
          />
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
          Tüm Ayarları Kaydet
        </button>
      </div>
    </div>
  )
}
