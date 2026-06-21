import { useState, useEffect, useCallback } from 'react'
import { Loader2, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { api, Kurye, Restoran, GecmisSiparis } from '../../lib/api'

function defaultStart() {
  const d = new Date(); d.setDate(d.getDate() - 7); d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 16)
}
function defaultEnd() {
  const d = new Date(); d.setHours(23, 59, 0, 0)
  return d.toISOString().slice(0, 16)
}

const DURUM_RENKLER: Record<string, string> = {
  'Teslim Edildi': 'bg-emerald-50 text-emerald-700',
  'Beklemede': 'bg-amber-50 text-amber-700',
  'Atandı': 'bg-blue-50 text-blue-700',
  'Yolda': 'bg-indigo-50 text-indigo-700',
  'İptal': 'bg-red-50 text-red-600',
}

const ODEME_RENKLER: Record<string, string> = {
  'Nakit': 'bg-emerald-50 text-emerald-700',
  'Kredi Kartı': 'bg-blue-50 text-blue-700',
  'Yemek Kartı': 'bg-amber-50 text-amber-700',
  'Online': 'bg-purple-50 text-purple-700',
}

const KANAL_STYLE: Record<string, { badge: string; dot: string }> = {
  'Telefon': { badge: 'bg-sky-50 text-sky-700', dot: 'bg-sky-500' },
  'WhatsApp': { badge: 'bg-green-50 text-green-700', dot: 'bg-green-500' },
  'Uygulama': { badge: 'bg-violet-50 text-violet-700', dot: 'bg-violet-500' },
  'Web Sitesi': { badge: 'bg-indigo-50 text-indigo-700', dot: 'bg-indigo-500' },
  'Yemeksepeti': { badge: 'bg-orange-50 text-orange-700', dot: 'bg-orange-500' },
  'Getir Yemek': { badge: 'bg-purple-50 text-purple-700', dot: 'bg-purple-500' },
  'Trendyol Yemek': { badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  'Migros Yemek': { badge: 'bg-teal-50 text-teal-700', dot: 'bg-teal-500' },
}
function kanalStyle(kanal?: string | null) {
  return KANAL_STYLE[kanal || ''] || { badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' }
}

function fmtTarih(s: string) {
  try {
    const d = new Date(s)
    return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  } catch { return s }
}
function fmt(n: number) { return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

export default function GecmisSiparisler() {
  const [kuryeler, setKuryeler] = useState<Kurye[]>([])
  const [restoranlar, setRestoranlar] = useState<Restoran[]>([])
  const [data, setData] = useState<{ siparisler: GecmisSiparis[]; toplam: number; sayfa_sayisi: number; ozet: { siparis_sayisi: number; toplam_tutar: number; odeme_gruplari: Record<string, { sayi: number; tutar: number }> } } | null>(null)
  const [loading, setLoading] = useState(true)

  // Filters
  const [baslangic, setBaslangic] = useState(defaultStart)
  const [bitis, setBitis] = useState(defaultEnd)
  const [restoranId, setRestoranId] = useState<number | undefined>()
  const [kuryeId, setKuryeId] = useState<number | undefined>()
  const [odemeTip, setOdemeTip] = useState('')
  const [durum, setDurum] = useState('')
  const [siralama, setSiralama] = useState('Yeni → Eski')
  const [sayfa, setSayfa] = useState(1)
  const LIMIT = 25

  const fetchLists = useCallback(async () => {
    const [ks, rs] = await Promise.all([api.kuryeler.list(), api.restoranlar.list()])
    setKuryeler(ks)
    setRestoranlar(rs)
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await api.raporlar.gecmis({
        baslangic, bitis,
        restoran_id: restoranId,
        kurye_id: kuryeId,
        odeme_yontemi: odemeTip || undefined,
        durum: durum || undefined,
        sayfa,
        limit: LIMIT,
      })
      setData(result)
    } finally { setLoading(false) }
  }, [baslangic, bitis, restoranId, kuryeId, odemeTip, durum, sayfa])

  useEffect(() => { fetchLists() }, [fetchLists])
  useEffect(() => { fetchData() }, [fetchData])

  function handleFiltre() { setSayfa(1); fetchData() }

  const siparisler = data?.siparisler || []
  const ozet = data?.ozet

  return (
    <div>
      {/* Filters Row */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Restoran</label>
            <select value={restoranId ?? ''} onChange={e => { setRestoranId(e.target.value ? Number(e.target.value) : undefined); setSayfa(1) }}
              className="w-full px-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20">
              <option value="">Tüm Restoranlar ({restoranlar.length})</option>
              {restoranlar.map(r => <option key={r.id} value={r.id}>{r.ad}</option>)}
            </select>
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Kurye</label>
            <select value={kuryeId ?? ''} onChange={e => { setKuryeId(e.target.value ? Number(e.target.value) : undefined); setSayfa(1) }}
              className="w-full px-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20">
              <option value="">Tüm Kuryeler ({kuryeler.length})</option>
              {kuryeler.map(k => <option key={k.id} value={k.id}>{k.ad}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Başlangıç</label>
            <input type="datetime-local" value={baslangic} onChange={e => setBaslangic(e.target.value)}
              className="w-full px-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Bitiş</label>
            <input type="datetime-local" value={bitis} onChange={e => setBitis(e.target.value)}
              className="w-full px-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Ödeme</label>
            <select value={odemeTip} onChange={e => { setOdemeTip(e.target.value); setSayfa(1) }}
              className="w-full px-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20">
              <option value="">Tüm Ödemeler</option>
              {['Nakit','Kredi Kartı','Yemek Kartı','Online'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Durum</label>
            <div className="flex gap-2">
              <select value={durum} onChange={e => { setDurum(e.target.value); setSayfa(1) }}
                className="flex-1 px-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20">
                <option value="">Tümü</option>
                {['Teslim Edildi','Beklemede','Atandı','Yolda','İptal'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <button onClick={handleFiltre} className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">
                <Filter size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Sort + summary */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {ozet && <>
              <span><span className="font-semibold text-gray-800">{ozet.siparis_sayisi}</span> sipariş</span>
              <span><span className="font-semibold text-gray-800">₺{fmt(ozet.toplam_tutar)}</span> toplam</span>
              {Object.entries(ozet.odeme_gruplari).map(([k, v]) => (
                <span key={k} className="hidden md:inline text-gray-400">{k}: <span className="font-medium text-gray-700">₺{fmt(v.tutar)}</span></span>
              ))}
            </>}
          </div>
          <select value={siralama} onChange={e => setSiralama(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg">
            <option>Yeni → Eski</option>
            <option>Eski → Yeni</option>
            <option>Tutar ↓</option>
            <option>Tutar ↑</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={26} className="animate-spin text-primary-600" /></div>
        ) : siparisler.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">Bu filtre için sipariş bulunamadı</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Tarih / Saat</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Kanal</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Müşteri</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Kurye</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Restoran</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Ödeme</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Durum</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 hidden lg:table-cell">Adres</th>
                </tr>
              </thead>
              <tbody>
                {siparisler.map(s => (
                  <tr key={s.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/30">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtTarih(s.olusturma_tarihi)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${kanalStyle(s.kanal).badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${kanalStyle(s.kanal).dot}`} />
                        {s.kanal || 'Telefon'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-800">{s.musteri_ad || '—'}</p>
                      <p className="text-xs text-gray-400">{s.musteri_telefon || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <p>{s.kurye_ad || '—'}</p>
                      {s.kurye_telefon && <p className="text-xs text-gray-400">{s.kurye_telefon}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{s.restoran_ad || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <p className="text-sm font-semibold text-gray-800">₺{fmt(s.tutar)}</p>
                      <span className={`inline-block mt-0.5 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${ODEME_RENKLER[s.odeme_yontemi] || 'bg-gray-100 text-gray-600'}`}>{s.odeme_yontemi}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DURUM_RENKLER[s.durum] || 'bg-gray-100 text-gray-600'}`}>{s.durum}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell max-w-[180px] truncate">{s.teslimat_adresi || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {(data?.sayfa_sayisi || 1) > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Sayfa {sayfa} / {data?.sayfa_sayisi} · Toplam {data?.toplam} kayıt
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSayfa(p => Math.max(1, p - 1))} disabled={sayfa === 1}
                    className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                    <ChevronLeft size={14} />
                  </button>
                  <button onClick={() => setSayfa(p => Math.min(data?.sayfa_sayisi || 1, p + 1))} disabled={sayfa === (data?.sayfa_sayisi || 1)}
                    className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
