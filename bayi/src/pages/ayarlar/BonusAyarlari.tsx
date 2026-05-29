import { useState, useEffect, useCallback } from 'react'
import { Loader2, Save, Trophy, Clock, Calendar, CalendarDays, Info } from 'lucide-react'
import { api, BayiAyarlar } from '../../lib/api'

type BonusTip = 'Tutar' | 'Yüzde'

interface PeriodConfig {
  aktif: number
  min: number
  tutar: number
  tip: BonusTip
}

interface BonusState {
  gunluk: PeriodConfig
  haftalik: PeriodConfig
  aylik: PeriodConfig
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary-600' : 'bg-gray-200'}`}
    >
      <span className={`block w-[18px] h-[18px] bg-white rounded-full shadow absolute top-[3px] transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} />
    </button>
  )
}

interface PeriodCardProps {
  label: string
  icon: React.ReactNode
  iconBg: string
  config: PeriodConfig
  onChange: (patch: Partial<PeriodConfig>) => void
  minLabel: string
  minMax: number
}

function PeriodCard({ label, icon, iconBg, config, onChange, minLabel, minMax }: PeriodCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{label}</p>
            <p className="text-xs text-gray-400">
              {config.aktif ? `${config.min}+ teslimat → ${config.tip === 'Tutar' ? `${config.tutar}₺` : `%${config.tutar}`} bonus` : `Kapalı — açmak için toggle'a tıklayın`}
            </p>
          </div>
        </div>
        <Toggle checked={!!config.aktif} onChange={v => onChange({ aktif: v ? 1 : 0 })} />
      </div>

      {!!config.aktif && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-500">{minLabel}</label>
              <span className="text-sm font-bold text-primary-600">{config.min} teslimat</span>
            </div>
            <input
              type="range" min={1} max={minMax} step={1} value={config.min}
              onChange={e => onChange({ min: Number(e.target.value) })}
              className="w-full h-1.5 accent-primary-600"
            />
            <div className="flex justify-between text-xs text-gray-300 mt-0.5">
              <span>1</span><span>{minMax}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Bonus Tipi</label>
            <div className="flex gap-2">
              {(['Tutar', 'Yüzde'] as BonusTip[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onChange({ tip: t })}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${config.tip === t ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  {t === 'Tutar' ? '₺ Sabit Tutar' : '% Yüzde'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {config.tip === 'Tutar' ? 'Bonus Tutarı (₺)' : 'Bonus Oranı (%)'}
            </label>
            <div className="relative">
              <input
                type="number" min={0} step={config.tip === 'Tutar' ? 5 : 0.5}
                value={config.tutar}
                onChange={e => onChange({ tutar: Number(e.target.value) })}
                className="w-full px-3 py-2 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                {config.tip === 'Tutar' ? '₺' : '%'}
              </span>
            </div>
            {config.tip === 'Yüzde' && (
              <p className="text-xs text-gray-400 mt-1">Kurye toplam kazancının %{config.tutar}'i bonus olarak eklenir</p>
            )}
            {config.tip === 'Tutar' && (
              <p className="text-xs text-gray-400 mt-1">Hedef tutulduğunda kurye {config.tutar}₺ sabit bonus alır</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ayarlarToBonusState(a: BayiAyarlar): BonusState {
  return {
    gunluk: {
      aktif: a.bonus_gunluk_aktif ?? 0,
      min: a.bonus_gunluk_min ?? 10,
      tutar: a.bonus_gunluk_tutar ?? 50,
      tip: (a.bonus_gunluk_tip as BonusTip) || 'Tutar',
    },
    haftalik: {
      aktif: a.bonus_haftalik_aktif ?? 0,
      min: a.bonus_haftalik_min ?? 50,
      tutar: a.bonus_haftalik_tutar ?? 200,
      tip: (a.bonus_haftalik_tip as BonusTip) || 'Tutar',
    },
    aylik: {
      aktif: a.bonus_aylik_aktif ?? 0,
      min: a.bonus_aylik_min ?? 200,
      tutar: a.bonus_aylik_tutar ?? 5,
      tip: (a.bonus_aylik_tip as BonusTip) || 'Yüzde',
    },
  }
}

export default function BonusAyarlari() {
  const [bonus, setBonus] = useState<BonusState>({
    gunluk: { aktif: 0, min: 10, tutar: 50, tip: 'Tutar' },
    haftalik: { aktif: 0, min: 50, tutar: 200, tip: 'Tutar' },
    aylik: { aktif: 0, min: 200, tutar: 5, tip: 'Yüzde' },
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const a = await api.ayarlar.get()
      setBonus(ayarlarToBonusState(a))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function updatePeriod(period: keyof BonusState, patch: Partial<PeriodConfig>) {
    setBonus(prev => ({ ...prev, [period]: { ...prev[period], ...patch } }))
  }

  async function handleSave() {
    setSaving(true); setSuccess(''); setError('')
    try {
      await api.ayarlar.update({
        bonus_gunluk_aktif: bonus.gunluk.aktif,
        bonus_gunluk_min: bonus.gunluk.min,
        bonus_gunluk_tutar: bonus.gunluk.tutar,
        bonus_gunluk_tip: bonus.gunluk.tip,
        bonus_haftalik_aktif: bonus.haftalik.aktif,
        bonus_haftalik_min: bonus.haftalik.min,
        bonus_haftalik_tutar: bonus.haftalik.tutar,
        bonus_haftalik_tip: bonus.haftalik.tip,
        bonus_aylik_aktif: bonus.aylik.aktif,
        bonus_aylik_min: bonus.aylik.min,
        bonus_aylik_tutar: bonus.aylik.tutar,
        bonus_aylik_tip: bonus.aylik.tip,
      })
      setSuccess('Bonus ayarları kaydedildi')
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaydetme başarısız')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-primary-600" /></div>

  const anyActive = bonus.gunluk.aktif || bonus.haftalik.aktif || bonus.aylik.aktif

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-semibold text-gray-800">Bonus Ayarları</h2>
          <p className="text-xs text-gray-400 mt-0.5">Kuryelere günlük, haftalık ve aylık performans bonusu tanımlayın</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-60"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>

      {success && <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-emerald-700">{success}</div>}
      {error && <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>}

      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Bonus Periyotları</p>

      <PeriodCard
        label="Günlük Bonus"
        icon={<Clock size={16} className="text-blue-600" />}
        iconBg="bg-blue-50"
        config={bonus.gunluk}
        onChange={p => updatePeriod('gunluk', p)}
        minLabel="Günlük minimum teslimat sayısı"
        minMax={50}
      />

      <PeriodCard
        label="Haftalık Bonus"
        icon={<CalendarDays size={16} className="text-emerald-600" />}
        iconBg="bg-emerald-50"
        config={bonus.haftalik}
        onChange={p => updatePeriod('haftalik', p)}
        minLabel="Haftalık minimum teslimat sayısı"
        minMax={200}
      />

      <PeriodCard
        label="Aylık Bonus"
        icon={<Calendar size={16} className="text-purple-600" />}
        iconBg="bg-purple-50"
        config={bonus.aylik}
        onChange={p => updatePeriod('aylik', p)}
        minLabel="Aylık minimum teslimat sayısı"
        minMax={800}
      />

      <div className="flex items-start gap-2.5 p-3.5 bg-gray-50 rounded-xl border border-gray-200">
        <Info size={14} className="text-gray-400 mt-0.5 shrink-0" />
        <p className="text-xs text-gray-500">
          {anyActive
            ? 'Kurye bir periyotta tanımlı aralığa girdiğinde ilgili bonus otomatik olarak hesaplanır.'
            : 'Kurye bir periyotta tanımlı aralığa girdiğinde ilgili bonus otomatik olarak hesaplanır.'}
        </p>
      </div>

      {anyActive && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 mb-3">Aktif Bonus Özeti</p>
          <div className="space-y-2">
            {bonus.gunluk.aktif ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-1.5"><Clock size={12} className="text-blue-500" /> Günlük</span>
                <span className="font-medium text-gray-800">{bonus.gunluk.min}+ teslimat → {bonus.gunluk.tip === 'Tutar' ? `${bonus.gunluk.tutar}₺` : `%${bonus.gunluk.tutar}`}</span>
              </div>
            ) : null}
            {bonus.haftalik.aktif ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-1.5"><CalendarDays size={12} className="text-emerald-500" /> Haftalık</span>
                <span className="font-medium text-gray-800">{bonus.haftalik.min}+ teslimat → {bonus.haftalik.tip === 'Tutar' ? `${bonus.haftalik.tutar}₺` : `%${bonus.haftalik.tutar}`}</span>
              </div>
            ) : null}
            {bonus.aylik.aktif ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-1.5"><Trophy size={12} className="text-purple-500" /> Aylık</span>
                <span className="font-medium text-gray-800">{bonus.aylik.min}+ teslimat → {bonus.aylik.tip === 'Tutar' ? `${bonus.aylik.tutar}₺` : `%${bonus.aylik.tutar}`}</span>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
