import { useState } from 'react'
import {
  Search, Plus, Bike, CheckCircle2, Navigation, PauseCircle, RefreshCw, Ban,
  MoreVertical, Eye, CreditCard, MapPin, Phone, Radio,
} from 'lucide-react'
import { api, Siparis, Kurye, Restoran } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { KuryeAtaModal, SiparisDetayModal, SiparisAlanModal, YeniSiparisModal } from './SiparisModals'

function durumBadge(durum: Siparis['durum']) {
  const map: Record<string, string> = {
    'Beklemede': 'bg-amber-100 text-amber-700',
    'Atandı': 'bg-blue-100 text-blue-700',
    'Yolda': 'bg-indigo-100 text-indigo-700',
    'Teslim Edildi': 'bg-emerald-100 text-emerald-700',
    'İptal': 'bg-red-100 text-red-600',
  }
  return map[durum] || 'bg-gray-100 text-gray-600'
}

function odemeBadge(odeme: string) {
  const map: Record<string, string> = {
    'Nakit': 'bg-emerald-50 text-emerald-700',
    'Kredi Kartı': 'bg-blue-50 text-blue-700',
    'Yemek Kartı': 'bg-amber-50 text-amber-700',
    'Online': 'bg-purple-50 text-purple-700',
  }
  return map[odeme] || 'bg-gray-100 text-gray-600'
}

function kanalBadge(kanal?: string | null) {
  const map: Record<string, string> = {
    'Telefon': 'bg-sky-50 text-sky-700',
    'WhatsApp': 'bg-green-50 text-green-700',
    'Uygulama': 'bg-violet-50 text-violet-700',
    'Web Sitesi': 'bg-indigo-50 text-indigo-700',
    'Yemeksepeti': 'bg-orange-50 text-orange-700',
    'Getir': 'bg-purple-50 text-purple-700',
  }
  return map[kanal || ''] || 'bg-gray-100 text-gray-600'
}

function formatTarih(dt: string) {
  const d = new Date(dt)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

type AlanField = 'musteri_telefon' | 'teslimat_adresi' | 'odeme_yontemi' | 'kanal'

function RowActionsMenu({
  siparis: s, aktif, updatingDurum, delivering, open, onToggle, onClose, onDetay, onAlan, onDurumGuncelle, onTeslim,
}: {
  siparis: Siparis
  aktif: boolean
  updatingDurum: boolean
  delivering: boolean
  open: boolean
  onToggle: () => void
  onClose: () => void
  onDetay: () => void
  onAlan: (field: AlanField, title: string) => void
  onDurumGuncelle: (durum: string) => void
  onTeslim: () => void
}) {
  return (
    <div className="relative">
      <button onClick={onToggle} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600">
        <MoreVertical size={15} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={onClose} />
          <div className="absolute right-0 mt-1 w-52 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
            {s.durum === 'Atandı' && (
              <button onClick={() => { onDurumGuncelle('Yolda'); onClose() }} disabled={updatingDurum}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                <Navigation size={13} /> Yola Çıkar
              </button>
            )}
            {(s.durum === 'Atandı' || s.durum === 'Yolda') && (
              <button onClick={() => { onDurumGuncelle('Beklemede'); onClose() }} disabled={updatingDurum}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                <PauseCircle size={13} /> Beklet
              </button>
            )}
            {s.durum === 'Yolda' && (
              <button onClick={() => { onTeslim(); onClose() }} disabled={delivering}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                {delivering ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Teslim Et
              </button>
            )}
            {aktif && (
              <button onClick={() => { if (confirm('Sipariş iptal edilsin mi?')) onDurumGuncelle('İptal'); onClose() }} disabled={updatingDurum}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50">
                <Ban size={13} /> İptal Et
              </button>
            )}
            {(s.durum === 'Atandı' || s.durum === 'Yolda' || aktif) && <div className="my-1 border-t border-gray-100" />}
            <button onClick={() => { onDetay(); onClose() }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
              <Eye size={13} /> Sipariş Detay
            </button>
            <button onClick={() => { onAlan('odeme_yontemi', 'Ödeme Güncelleme'); onClose() }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
              <CreditCard size={13} /> Ödeme Güncelleme
            </button>
            <button onClick={() => { onAlan('kanal', 'Kanal Güncelleme'); onClose() }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
              <Radio size={13} /> Kanal Güncelleme
            </button>
            <button onClick={() => { onAlan('teslimat_adresi', 'Adres Güncelleme'); onClose() }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
              <MapPin size={13} /> Adres Güncelleme
            </button>
            <button onClick={() => { onAlan('musteri_telefon', 'Telefon Güncelleme'); onClose() }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
              <Phone size={13} /> Telefon Güncelleme
            </button>
          </div>
        </>
      )}
    </div>
  )
}

const DURUMLAR = ['Tümü', 'Beklemede', 'Atandı', 'Yolda', 'Teslim Edildi', 'İptal'] as const

interface SiparisTablosuProps {
  siparisler: Siparis[]
  kuryeler: Kurye[]
  restoranlar: Restoran[]
  onRefresh: () => void | Promise<void>
  title?: string
  showYeniSiparis?: boolean
  maxHeight?: string
  bare?: boolean
}

export default function SiparisTablosu({
  siparisler, kuryeler, restoranlar, onRefresh, title, showYeniSiparis = true, maxHeight, bare = false,
}: SiparisTablosuProps) {
  const { refreshBayilik } = useAuth()
  const [search, setSearch] = useState('')
  const [durumFilter, setDurumFilter] = useState<typeof DURUMLAR[number]>('Tümü')
  const [showYeni, setShowYeni] = useState(false)
  const [ataModal, setAtaModal] = useState<Siparis | null>(null)
  const [detayModal, setDetayModal] = useState<Siparis | null>(null)
  const [alanModal, setAlanModal] = useState<{ siparis: Siparis; field: AlanField; title: string } | null>(null)
  const [menuFor, setMenuFor] = useState<number | null>(null)
  const [delivering, setDelivering] = useState<number | null>(null)
  const [updatingDurum, setUpdatingDurum] = useState<number | null>(null)

  async function handleTeslim(s: Siparis) {
    if (!confirm('Teslim edildi olarak işaretlensin mi? 1 kontör düşülecektir.')) return
    setDelivering(s.id)
    try {
      await api.siparisler.teslim(s.id)
      await onRefresh()
      await refreshBayilik()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Hata')
    } finally {
      setDelivering(null)
    }
  }

  async function handleDurumGuncelle(s: Siparis, durum: string) {
    setUpdatingDurum(s.id)
    try {
      await api.siparisler.setDurum(s.id, durum)
      await onRefresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Hata')
    } finally {
      setUpdatingDurum(null)
    }
  }

  const q = search.trim().toLowerCase()
  const filtered = siparisler.filter(s => {
    const matchDurum = durumFilter === 'Tümü' || s.durum === durumFilter
    const matchSearch = q === '' || [s.siparis_no, s.musteri_ad, s.kurye_ad, s.restoran_ad, s.teslimat_adresi, s.musteri_telefon, s.kurye_telefon, s.kanal]
      .some(v => (v || '').toLowerCase().includes(q))
    return matchDurum && matchSearch
  })

  const counts: Record<string, number> = { Tümü: siparisler.length }
  for (const d of DURUMLAR) if (d !== 'Tümü') counts[d] = siparisler.filter(s => s.durum === d).length

  return (
    <div className={bare ? 'flex flex-col h-full min-h-0' : 'bg-white rounded-xl border border-gray-100 overflow-hidden'}>
      {showYeni && <YeniSiparisModal restoranlar={restoranlar} onClose={() => setShowYeni(false)} onSave={onRefresh} />}
      {ataModal && <KuryeAtaModal siparis={ataModal} kuryeler={kuryeler} onClose={() => setAtaModal(null)} onSave={onRefresh} />}
      {detayModal && <SiparisDetayModal siparis={detayModal} onClose={() => setDetayModal(null)} />}
      {alanModal && (
        <SiparisAlanModal
          siparis={alanModal.siparis}
          field={alanModal.field}
          title={alanModal.title}
          onClose={() => setAlanModal(null)}
          onSave={onRefresh}
        />
      )}

      <div className={`px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap ${bare ? 'shrink-0' : ''}`}>
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <h2 className="text-sm font-semibold text-gray-800">{title || 'Siparişler'}</h2>
          <span className="text-xs text-gray-400">{filtered.length} sipariş</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Müşteri, kurye, restoran, adres, telefon..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 w-64"
            />
          </div>
          <div className="flex gap-1">
            {DURUMLAR.map(d => (
              <button key={d} onClick={() => setDurumFilter(d)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${durumFilter === d ? 'bg-primary-600 text-white' : 'bg-gray-50 border border-gray-200 text-gray-600 hover:border-primary-600'}`}>
                {d}
                <span className={`px-1.5 rounded-full text-[10px] ${durumFilter === d ? 'bg-white/20' : 'bg-gray-200 text-gray-500'}`}>{counts[d]}</span>
              </button>
            ))}
          </div>
          {showYeniSiparis && (
            <button onClick={() => setShowYeni(true)} className="btn-primary text-xs whitespace-nowrap">
              <Plus size={14} /> Yeni Sipariş
            </button>
          )}
        </div>
      </div>

      <div className={bare ? 'flex-1 min-h-0 overflow-y-auto' : 'overflow-y-auto'} style={!bare && maxHeight ? { maxHeight } : undefined}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 z-[1]">
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sipariş</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Müşteri</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kurye</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tutar</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ödeme</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Durum</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tarih</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-16 text-sm text-gray-400">Sipariş bulunmuyor</td></tr>
            ) : (
              filtered.map(s => {
                const aktif = s.durum !== 'Teslim Edildi' && s.durum !== 'İptal'
                return (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-800">{s.siparis_no}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-xs text-gray-400">{s.restoran_ad || '—'}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap ${kanalBadge(s.kanal)}`}>{s.kanal || 'Telefon'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-800">{s.musteri_ad || 'Müşteri'}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[170px]" title={s.teslimat_adresi || undefined}>
                        {s.musteri_telefon || '—'}{s.teslimat_adresi ? ` · ${s.teslimat_adresi}` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {aktif ? (
                        <button
                          onClick={() => setAtaModal(s)}
                          title={s.kurye_id ? 'Kurye Değiştir' : 'Kurye Ata'}
                          className="inline-flex items-center gap-1.5 text-gray-700 hover:text-primary-600 font-medium"
                        >
                          <Bike size={13} className="text-gray-400" />
                          {s.kurye_ad || <span className="text-gray-400">Atanmamış</span>}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-gray-700">
                          <Bike size={13} className="text-gray-300" />
                          {s.kurye_ad || <span className="text-gray-400">—</span>}
                        </span>
                      )}
                      {s.kurye_telefon && <p className="text-xs text-gray-400 mt-0.5 ml-[19px]">{s.kurye_telefon}</p>}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-800">{s.tutar.toFixed(2)} ₺</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${odemeBadge(s.odeme_yontemi)}`}>{s.odeme_yontemi}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${durumBadge(s.durum)}`}>{s.durum}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatTarih(s.olusturma_tarihi)}</td>
                    <td className="px-2 py-3">
                      <div className="flex items-center justify-end">
                        <RowActionsMenu
                          siparis={s}
                          aktif={aktif}
                          updatingDurum={updatingDurum === s.id}
                          delivering={delivering === s.id}
                          open={menuFor === s.id}
                          onToggle={() => setMenuFor(menuFor === s.id ? null : s.id)}
                          onClose={() => setMenuFor(null)}
                          onDetay={() => setDetayModal(s)}
                          onAlan={(field, ftitle) => setAlanModal({ siparis: s, field, title: ftitle })}
                          onDurumGuncelle={durum => handleDurumGuncelle(s, durum)}
                          onTeslim={() => handleTeslim(s)}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
