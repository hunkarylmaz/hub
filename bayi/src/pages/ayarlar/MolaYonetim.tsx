import { useState, useEffect, useCallback } from 'react'
import { Clock, Plus, Trash2, Loader2, CheckCircle2, XCircle, Timer, BarChart2, Settings2, User } from 'lucide-react'
import { api } from '../../lib/api'

function fmt2(n: number) { return String(n).padStart(2, '0') }
function sureText(dk: number) {
  if (dk < 60) return `${dk} dk`
  return `${Math.floor(dk / 60)}s ${dk % 60 > 0 ? fmt2(dk % 60) + 'dk' : ''}`
}
function formatTarih(dt: string) {
  const d = new Date(dt)
  return `${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')}.${d.getFullYear()} ${fmt2(d.getHours())}:${fmt2(d.getMinutes())}:${fmt2(d.getSeconds())}`
}

type MolaTalep = {
  id: number; kurye_id: number; kurye_ad: string | null; kurye_tel: string | null
  sure_dk: number; durum: string; talep_tarihi: string; baslangic: string | null; bitis: string | null
}
type MolaRapor = {
  kurye_siralaması: { kurye_id: number; kurye_ad: string; kurye_tel: string | null; mola_sayisi: number; toplam_sure_dk: number }[]
  saatlik: { saat: string; sayi: number }[]
  gunluk: { gun: string; sayi: number }[]
}

const DURUM_TABS = ['Tümü', 'Bekleyen', 'Aktif', 'Tamamlandı', 'Reddedildi']

function durumBadge(durum: string) {
  const map: Record<string, string> = {
    'Bekliyor':   'bg-amber-100 text-amber-700',
    'Aktif':      'bg-blue-100 text-blue-700',
    'Tamamlandı': 'bg-emerald-100 text-emerald-700',
    'Reddedildi': 'bg-red-100 text-red-600',
  }
  return map[durum] || 'bg-gray-100 text-gray-600'
}

// ── Mola Talepleri Tab ────────────────────────────────────────────────────────
function MolaTalepleriTab() {
  const [talepler, setTalepler] = useState<MolaTalep[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Tümü')
  const [acting, setActing] = useState<number | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try { setTalepler(await api.molaTalepleri.list(filter)) }
    finally { setLoading(false) }
  }, [filter])

  useEffect(() => { fetch() }, [fetch])

  async function updateDurum(id: number, durum: string) {
    setActing(id)
    try { await api.molaTalepleri.updateDurum(id, durum); await fetch() }
    catch (e) { alert(e instanceof Error ? e.message : 'Hata') }
    finally { setActing(null) }
  }

  return (
    <div>
      <div className="flex gap-1 mb-5 flex-wrap">
        {DURUM_TABS.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${filter === t ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-400'}`}>
            {t} {filter === t && `(${talepler.length})`}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-primary-600" />
          <h3 className="font-semibold text-gray-800">Mola Talepleri</h3>
          <p className="text-xs text-gray-400 ml-1">Kuryelerin mola taleplerini yönetin</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10"><Loader2 size={20} className="animate-spin text-primary-600" /></div>
        ) : talepler.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">Bu filtre için talep bulunamadı</div>
        ) : (
          <div className="space-y-3">
            {talepler.map(t => (
              <div key={t.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xs font-bold shrink-0">
                        {(t.kurye_ad || '?').split(' ').map((n: string) => n[0]).join('').slice(0,2)}
                      </div>
                      <span className="text-sm font-semibold text-gray-800">{t.kurye_ad || 'Bilinmeyen Kurye'}</span>
                      {t.kurye_tel && <span className="text-xs text-gray-400">{t.kurye_tel}</span>}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{formatTarih(t.talep_tarihi)}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span className="flex items-center gap-1"><Timer size={12} /> {sureText(t.sure_dk)}</span>
                      {t.baslangic && <span>Başlangıç: {t.baslangic.slice(11,16)}</span>}
                      {t.bitis && <span>Bitiş: {t.bitis.slice(11,16)}</span>}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${durumBadge(t.durum)}`}>{t.durum}</span>
                </div>
                {t.durum === 'Bekliyor' && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button onClick={() => updateDurum(t.id, 'Aktif')} disabled={acting === t.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600 disabled:opacity-60">
                      <CheckCircle2 size={13} /> Onayla
                    </button>
                    <button onClick={() => updateDurum(t.id, 'Reddedildi')} disabled={acting === t.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 disabled:opacity-60">
                      <XCircle size={13} /> Reddet
                    </button>
                  </div>
                )}
                {t.durum === 'Aktif' && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <button onClick={() => updateDurum(t.id, 'Tamamlandı')} disabled={acting === t.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 disabled:opacity-60">
                      <CheckCircle2 size={13} /> Tamamlandı İşaretle
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Raporlar Tab ──────────────────────────────────────────────────────────────
function RaporlarTab() {
  const [data, setData] = useState<MolaRapor | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.molaRaporlar.get().then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-primary-600" /></div>

  const maxSaatlik = Math.max(...(data?.saatlik || []).map(s => s.sayi), 1)
  const maxGunluk = Math.max(...(data?.gunluk || []).map(g => g.sayi), 1)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* En Çok Mola Kullanan */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">En Çok Mola Kullanan</h3>
            <span className="text-xs text-gray-400 border border-gray-200 px-2 py-1 rounded-lg">Son 7 Gün</span>
          </div>
          {!data?.kurye_siralaması?.length ? (
            <div className="py-8 text-center text-sm text-gray-400">Veri yok</div>
          ) : (
            <div className="space-y-3">
              {data.kurye_siralaması.slice(0, 5).map((k, i) => (
                <div key={k.kurye_id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-gray-400' : 'bg-orange-400'}`}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{k.kurye_ad}</p>
                    {k.kurye_tel && <p className="text-xs text-gray-400">{k.kurye_tel}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-primary-600">{k.mola_sayisi} mola</p>
                    <p className="text-xs text-gray-500">{sureText(k.toplam_sure_dk)}</p>
                  </div>
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-400 rounded-full" style={{ width: `${(k.mola_sayisi / (data.kurye_siralaması[0]?.mola_sayisi || 1)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saatlik Dağılım */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Saatlik Mola Dağılımı</h3>
            <span className="text-xs text-gray-400 border border-gray-200 px-2 py-1 rounded-lg">Son 7 Gün</span>
          </div>
          {!data?.saatlik?.length ? (
            <div className="py-8 text-center text-sm text-gray-400">Veri yok</div>
          ) : (
            <div className="space-y-2">
              {data.saatlik.map(s => (
                <div key={s.saat} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-12 shrink-0">{s.saat}</span>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${(s.sayi / maxSaatlik) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 w-12 text-right">{s.sayi} mola</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Günlük Dağılım */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Günlük Mola Dağılımı</h3>
          <span className="text-xs text-gray-400 border border-gray-200 px-2 py-1 rounded-lg">Son 15 Gün</span>
        </div>
        {!data?.gunluk?.length ? (
          <div className="py-8 text-center text-sm text-gray-400">Veri yok</div>
        ) : (
          <div className="flex items-end gap-2 overflow-x-auto pb-2" style={{ minHeight: 100 }}>
            {data.gunluk.map(g => (
              <div key={g.gun} className="flex flex-col items-center gap-1 min-w-[40px]">
                <div className="w-8 bg-primary-400 rounded-t" style={{ height: Math.max(4, (g.sayi / maxGunluk) * 80) }} title={`${g.gun}: ${g.sayi} mola`} />
                <p className="text-xs text-gray-400 whitespace-nowrap">{g.gun.slice(5)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tüm Kuryeler Tablosu */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <User size={14} className="text-primary-600" />
          <h3 className="font-semibold text-gray-800">Tüm Kuryeler</h3>
        </div>
        {!data?.kurye_siralaması?.length ? (
          <div className="py-8 text-center text-sm text-gray-400">Veri yok</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500">
                <th className="text-left py-2 pr-4">Kurye</th>
                <th className="text-right py-2 px-3">Mola Sayısı</th>
                <th className="text-right py-2 px-3">Toplam Süre</th>
              </tr>
            </thead>
            <tbody>
              {data.kurye_siralaması.map(k => (
                <tr key={k.kurye_id} className="border-b border-gray-50 last:border-0">
                  <td className="py-2 pr-4">
                    <p className="font-medium text-gray-800">{k.kurye_ad}</p>
                    {k.kurye_tel && <p className="text-xs text-gray-400">{k.kurye_tel}</p>}
                  </td>
                  <td className="py-2 px-3 text-right font-semibold text-primary-600">{k.mola_sayisi}</td>
                  <td className="py-2 px-3 text-right text-gray-600">{sureText(k.toplam_sure_dk)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── Ayarlar Tab ───────────────────────────────────────────────────────────────
function AyarlarTab() {
  const [gunluk_hakki, setGunlukHakki] = useState(2)
  const [sureler, setSureler] = useState<number[]>([15, 25, 35, 40])
  const [onay, setOnay] = useState('Manuel Onay')
  const [yasak, setYasak] = useState<{ baslangic: string; bitis: string }[]>([])
  const [yeniSure, setYeniSure] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.molaAyarlari.get().then(a => {
      setGunlukHakki(a.gunluk_mola_hakki)
      try { setSureler(JSON.parse(a.mola_sureleri)) } catch { setSureler([15,25,35,40]) }
      setOnay(a.onay_mekanizmasi)
      try { setYasak(JSON.parse(a.yasak_saatler)) } catch { setYasak([]) }
    })
  }, [])

  function surEkle() {
    const n = parseInt(yeniSure)
    if (!n || n <= 0) return
    setSureler(prev => [...prev, n].sort((a, b) => a - b))
    setYeniSure('')
  }

  async function handleSave() {
    setSaving(true)
    try {
      await api.molaAyarlari.update({
        gunluk_mola_hakki: gunluk_hakki,
        mola_sureleri: sureler,
        onay_mekanizmasi: onay,
        yasak_saatler: yasak,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Hata')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Settings2 size={16} className="text-primary-600" />
          <h3 className="font-semibold text-gray-800">Mola Ayarları</h3>
          <p className="text-xs text-gray-400 ml-1">Mola kurallarını yapılandırın</p>
        </div>

        <div className="space-y-5">
          {/* Günlük Mola Hakkı */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Günlük Mola Hakkı:</label>
            <input type="number" min={0} max={10} value={gunluk_hakki} onChange={e => setGunlukHakki(Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
            <p className="text-xs text-gray-400 mt-1">Bir kurye günde kaç mola kullanabilir</p>
          </div>

          {/* Mola Süreleri */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mola Süreleri (Dakika):</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {sureler.map((s, i) => (
                <div key={i} className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
                  <span className="text-sm font-medium text-gray-700">{s} dk</span>
                  <button onClick={() => setSureler(prev => prev.filter((_, j) => j !== i))}
                    className="w-5 h-5 rounded-md bg-red-500 hover:bg-red-600 flex items-center justify-center text-white">
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-1">
                <input type="number" min={1} value={yeniSure} onChange={e => setYeniSure(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && surEkle()}
                  placeholder="dk"
                  className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none text-center" />
                <button onClick={surEkle}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700">
                  <Plus size={12} /> Ekle
                </button>
              </div>
            </div>
          </div>

          {/* Onay Mekanizması */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Onay Mekanizması:</label>
            <select value={onay} onChange={e => setOnay(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/20">
              <option value="Manuel Onay">Manuel Onay</option>
              <option value="Otomatik Onay">Otomatik Onay</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">Talepler admin tarafından onaylanmalı</p>
          </div>

          {/* Yasak Saatler */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Yasak Saatler:</label>
            <div className="space-y-2 mb-3">
              {yasak.map((y, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="time" value={y.baslangic} onChange={e => setYasak(prev => prev.map((p, j) => j === i ? { ...p, baslangic: e.target.value } : p))}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
                  <span className="text-gray-400 shrink-0">-</span>
                  <input type="time" value={y.bitis} onChange={e => setYasak(prev => prev.map((p, j) => j === i ? { ...p, bitis: e.target.value } : p))}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
                  <button onClick={() => setYasak(prev => prev.filter((_, j) => j !== i))}
                    className="w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shrink-0">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setYasak(prev => [...prev, { baslangic: '17:00', bitis: '21:00' }])}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-xl hover:bg-primary-700">
              <Plus size={14} /> Yasak Saat Ekle
            </button>
            <p className="text-xs text-gray-400 mt-2">Bu saatlerde mola talebi oluşturulamaz</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white text-sm rounded-xl hover:bg-primary-700 disabled:opacity-60">
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle2 size={14} /> : null}
          {saved ? 'Kaydedildi' : 'Kaydet'}
        </button>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
const TABS = [
  { key: 'talepler', label: 'Mola Talepleri', icon: Clock },
  { key: 'raporlar', label: 'Raporlar',        icon: BarChart2 },
  { key: 'ayarlar',  label: 'Ayarlar',         icon: Settings2 },
]

export default function MolaYonetim() {
  const [tab, setTab] = useState('talepler')

  return (
    <div>
      <div className="flex gap-1 mb-5">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors ${tab === key ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-400'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === 'talepler' && <MolaTalepleriTab />}
      {tab === 'raporlar' && <RaporlarTab />}
      {tab === 'ayarlar'  && <AyarlarTab />}
    </div>
  )
}
