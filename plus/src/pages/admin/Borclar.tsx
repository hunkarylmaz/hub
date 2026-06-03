import { useEffect, useState, useCallback } from 'react'
import { CreditCard, ChevronRight, TrendingDown, Loader2, X, Check, History } from 'lucide-react'
import { api, PartnerBorc } from '../../lib/api'

interface Is { id: number; durum: string; fiyat: number; alis_il: string; alis_ilce: string; birakilis_il: string; birakilis_ilce: string; olusturma: string }
interface Odeme { id: number; miktar: number; aciklama: string; tarih: string }

export default function Borclar() {
  const [list, setList] = useState<PartnerBorc[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<PartnerBorc | null>(null)
  const [detay, setDetay] = useState<{ isler: Is[]; odemeler: Odeme[] } | null>(null)
  const [odemeModal, setOdemeModal] = useState(false)
  const [odemeForm, setOdemeForm] = useState({ miktar: '', aciklama: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setList(await api.admin.borclar.list()); setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function loadDetay(p: PartnerBorc) {
    setSelected(p)
    const d = await api.admin.borclar.detay(p.id)
    setDetay(d)
  }

  async function odeme() {
    if (!selected || !odemeForm.miktar) return
    setSaving(true)
    try {
      await api.admin.borclar.ode(selected.id, Number(odemeForm.miktar), odemeForm.aciklama)
      setOdemeModal(false); setOdemeForm({ miktar: '', aciklama: '' })
      load(); loadDetay(selected)
    } catch (e) { alert((e as Error).message) }
    finally { setSaving(false) }
  }

  const toplam = list.reduce((s, p) => s + p.kalan_borc, 0)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Borç Takibi</h1>
        <p className="text-sm text-gray-500 mt-0.5">Partner firmalarının borç durumu</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-xs text-gray-500 mb-1">Toplam Alacak</p>
          <p className="text-2xl font-bold text-red-600">₺{toplam.toLocaleString('tr-TR', {minimumFractionDigits:2})}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-gray-500 mb-1">Borçlu Partner</p>
          <p className="text-2xl font-bold text-gray-900">{list.filter(p => p.kalan_borc > 0).length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-gray-500 mb-1">Toplam Tamamlanan İş</p>
          <p className="text-2xl font-bold text-gray-900">{list.reduce((s,p) => s + p.tamamlandi, 0)}</p>
        </div>
      </div>

      <div className="flex gap-5">
        {/* List */}
        <div className="flex-1 min-w-0">
          <div className="card overflow-hidden">
            {loading ? (
              <div className="py-12 text-center text-sm text-gray-400">Yükleniyor...</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {list.map(p => (
                  <button key={p.id} onClick={() => loadDetay(p)}
                    className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 text-left transition-colors ${selected?.id === p.id ? 'bg-primary-50' : ''}`}>
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                      <CreditCard size={18} className="text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{p.firma_adi}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.tamamlandi} teslim · {p.aktif} aktif · {p.havuzda} havuzda</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${p.kalan_borc > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        ₺{p.kalan_borc.toLocaleString('tr-TR',{minimumFractionDigits:2})}
                      </p>
                      <p className="text-xs text-gray-400">kalan borç</p>
                    </div>
                    <ChevronRight size={14} className={`text-gray-300 shrink-0 ${selected?.id === p.id ? 'text-primary-500' : ''}`} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-80 shrink-0 space-y-4">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-bold text-gray-900">{selected.firma_adi}</p>
                  <p className="text-xs text-gray-400">{selected.yetkili_ad}</p>
                </div>
                <button onClick={() => { setSelected(null); setDetay(null) }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={14} /></button>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Toplam Borç</span>
                  <span className="font-bold text-gray-800">₺{selected.toplam_borc.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ödenen</span>
                  <span className="font-bold text-emerald-600">₺{selected.toplam_odendi.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold text-gray-700">Kalan</span>
                  <span className={`font-bold text-base ${selected.kalan_borc > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    ₺{selected.kalan_borc.toFixed(2)}
                  </span>
                </div>
              </div>
              <button onClick={() => setOdemeModal(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700">
                <TrendingDown size={15} /> Ödeme Kaydet
              </button>
            </div>

            {detay && (
              <>
                {/* Recent jobs */}
                <div className="card overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase">Son İşler</p>
                  </div>
                  <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
                    {detay.isler.slice(0,10).map(is => (
                      <div key={is.id} className="flex items-center justify-between px-4 py-2.5">
                        <div>
                          <p className="text-xs font-semibold text-gray-700">#{String(is.id).padStart(4,'0')}</p>
                          <p className="text-xs text-gray-400">{is.alis_il} → {is.birakilis_il}</p>
                        </div>
                        <span className="text-xs font-bold text-gray-700">₺{is.fiyat.toFixed(2)}</span>
                      </div>
                    ))}
                    {detay.isler.length === 0 && <div className="py-4 text-center text-xs text-gray-400">İş yok</div>}
                  </div>
                </div>

                {/* Payment history */}
                {detay.odemeler.length > 0 && (
                  <div className="card overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                      <History size={13} className="text-gray-400" />
                      <p className="text-xs font-bold text-gray-500 uppercase">Ödeme Geçmişi</p>
                    </div>
                    <div className="divide-y divide-gray-50 max-h-40 overflow-y-auto">
                      {detay.odemeler.map(o => (
                        <div key={o.id} className="flex items-center justify-between px-4 py-2.5">
                          <div>
                            <p className="text-xs text-gray-400">{new Date(o.tarih).toLocaleDateString('tr-TR')}</p>
                            {o.aciklama && <p className="text-xs text-gray-400 italic">{o.aciklama}</p>}
                          </div>
                          <span className="text-xs font-bold text-emerald-600">+₺{o.miktar.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Ödeme modal */}
      {odemeModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Ödeme Kaydet</h2>
              <button onClick={() => setOdemeModal(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">{selected.firma_adi} — Kalan: <span className="font-bold text-red-600">₺{selected.kalan_borc.toFixed(2)}</span></p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Ödeme Tutarı (₺) *</label>
                <input type="number" step="0.01" min="0" value={odemeForm.miktar}
                  onChange={e => setOdemeForm(f => ({ ...f, miktar: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Not</label>
                <input type="text" value={odemeForm.aciklama} placeholder="Açıklama (isteğe bağlı)"
                  onChange={e => setOdemeForm(f => ({ ...f, aciklama: e.target.value }))} className="input-field" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setOdemeModal(false)} className="btn-secondary flex-1">İptal</button>
              <button onClick={odeme} disabled={saving || !odemeForm.miktar}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
