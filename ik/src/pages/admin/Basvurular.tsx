import { useState, useEffect, useCallback } from 'react'
import { Trash2, X, Loader2, Phone, Mail, MapPin, UserCheck, Filter } from 'lucide-react'
import { api, Basvuru, BasvuruDurum, Bolge } from '../../lib/api'

const DURUMLAR: BasvuruDurum[] = ['Yeni', 'Değerlendiriliyor', 'Olumlu', 'Olumsuz', 'İşe Alındı']
const DURUM_RENK: Record<string, string> = {
  'Yeni': 'bg-blue-50 text-blue-700',
  'Değerlendiriliyor': 'bg-amber-50 text-amber-700',
  'Olumlu': 'bg-emerald-50 text-emerald-700',
  'Olumsuz': 'bg-red-50 text-red-700',
  'İşe Alındı': 'bg-violet-50 text-violet-700',
}

export default function Basvurular() {
  const [list, setList] = useState<Basvuru[]>([])
  const [bolgeler, setBolgeler] = useState<Bolge[]>([])
  const [loading, setLoading] = useState(true)
  const [durumFilter, setDurumFilter] = useState('')
  const [detail, setDetail] = useState<Basvuru | null>(null)
  const [iseAlModal, setIseAlModal] = useState<Basvuru | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    api.basvurular.list(durumFilter).then(setList).finally(() => setLoading(false))
  }, [durumFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => { api.bolgeler.list().then(setBolgeler) }, [])

  async function setDurum(b: Basvuru, durum: BasvuruDurum) {
    await api.basvurular.update(b.id, { durum })
    setList(l => l.map(x => x.id === b.id ? { ...x, durum } : x))
    if (detail?.id === b.id) setDetail({ ...detail, durum })
  }

  async function remove(b: Basvuru) {
    if (!confirm(`${b.ad_soyad} adlı başvuru silinsin mi?`)) return
    await api.basvurular.remove(b.id)
    setDetail(null)
    load()
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">İş Başvuruları</h1>
        <p className="text-sm text-gray-500 mt-0.5">Başvuru formundan gelen aday başvurularını değerlendirin.</p>
      </div>

      <div className="card p-4 flex items-center gap-2 flex-wrap">
        <Filter size={15} className="text-gray-400" />
        <button onClick={() => setDurumFilter('')} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${durumFilter === '' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>Tümü</button>
        {DURUMLAR.map(d => (
          <button key={d} onClick={() => setDurumFilter(d)} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${durumFilter === d ? 'bg-gray-900 text-white' : DURUM_RENK[d]}`}>{d}</button>
        ))}
      </div>

      {loading ? (
        <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-500" size={28} /></div>
      ) : list.length === 0 ? (
        <div className="card p-10 text-center text-gray-400 text-sm">Bu kritere uygun başvuru bulunmuyor.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map(b => (
            <div key={b.id} className="card p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDetail(b)}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-gray-900">{b.ad_soyad}</p>
                  <p className="text-xs text-gray-400">{b.pozisyon || '—'}</p>
                </div>
                <span className={`badge shrink-0 ${DURUM_RENK[b.durum]}`}>{b.durum}</span>
              </div>
              <div className="mt-3 space-y-1 text-xs text-gray-500">
                <div className="flex items-center gap-1.5"><Phone size={12} />{b.telefon}</div>
                {b.email && <div className="flex items-center gap-1.5"><Mail size={12} />{b.email}</div>}
                {b.sehir && <div className="flex items-center gap-1.5"><MapPin size={12} />{b.sehir}</div>}
              </div>
              <p className="text-[11px] text-gray-400 mt-3">{b.olusturma}</p>
            </div>
          ))}
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{detail.ad_soyad}</h3>
                <p className="text-xs text-gray-400">{detail.olusturma}</p>
              </div>
              <button onClick={() => setDetail(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <Info label="Telefon" value={detail.telefon} />
              <Info label="E-posta" value={detail.email || '—'} />
              <Info label="Pozisyon" value={detail.pozisyon || '—'} />
              <Info label="Şehir / Bölge" value={detail.sehir || '—'} />
              <Info label="Doğum Tarihi" value={detail.dogum_tarihi || '—'} />
              <Info label="Sürücü Belgesi" value={detail.ehliyet || '—'} />
              <Info label="Araç Durumu" value={detail.arac || '—'} />
              <Info label="Deneyim" value={detail.deneyim || '—'} />
            </div>
            {detail.mesaj && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 mb-1">Mesaj</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{detail.mesaj}</p>
              </div>
            )}

            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-1.5">Durum</p>
              <div className="flex gap-1.5 flex-wrap">
                {DURUMLAR.map(d => (
                  <button key={d} onClick={() => setDurum(detail, d)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${detail.durum === d ? 'ring-2 ring-offset-1 ring-gray-900' : ''} ${DURUM_RENK[d]}`}>{d}</button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => remove(detail)} className="btn-danger flex items-center gap-1.5"><Trash2 size={15} /> Sil</button>
              <button onClick={() => setIseAlModal(detail)} className="btn-primary flex-1 flex items-center justify-center gap-1.5">
                <UserCheck size={15} /> İşe Al → Personel Kaydı Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {iseAlModal && (
        <IseAlModal basvuru={iseAlModal} bolgeler={bolgeler} onClose={() => setIseAlModal(null)} onDone={() => { setIseAlModal(null); setDetail(null); load() }} />
      )}
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-gray-800">{value}</p>
    </div>
  )
}

function IseAlModal({ basvuru, bolgeler, onClose, onDone }: { basvuru: Basvuru; bolgeler: Bolge[]; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({
    pozisyon: basvuru.pozisyon || 'Kurye',
    bolge_id: bolgeler[0]?.id ? String(bolgeler[0].id) : '',
    maas: '',
    ise_giris_tarihi: new Date().toISOString().slice(0, 10),
  })
  const [saving, setSaving] = useState(false)

  async function submit() {
    setSaving(true)
    try {
      await api.basvurular.iseAl(basvuru.id, {
        pozisyon: form.pozisyon,
        bolge_id: form.bolge_id ? Number(form.bolge_id) : undefined,
        maas: form.maas ? Number(form.maas) : undefined,
        ise_giris_tarihi: form.ise_giris_tarihi,
      })
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">{basvuru.ad_soyad} — İşe Al</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>
        <p className="text-sm text-gray-500 mb-4">Bu başvuru personel kaydına dönüştürülecek ve "İşe Alındı" olarak işaretlenecektir.</p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Pozisyon</label>
            <input value={form.pozisyon} onChange={e => setForm(f => ({ ...f, pozisyon: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Bölge</label>
            <select value={form.bolge_id} onChange={e => setForm(f => ({ ...f, bolge_id: e.target.value }))} className="input-field">
              <option value="">Bölgesiz</option>
              {bolgeler.map(b => <option key={b.id} value={b.id}>{b.ad}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">İşe Giriş Tarihi</label>
            <input type="date" value={form.ise_giris_tarihi} onChange={e => setForm(f => ({ ...f, ise_giris_tarihi: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Maaş (₺)</label>
            <input type="number" value={form.maas} onChange={e => setForm(f => ({ ...f, maas: e.target.value }))} className="input-field" placeholder="İsteğe bağlı" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1">Vazgeç</button>
          <button onClick={submit} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-1.5">
            {saving ? <Loader2 size={14} className="animate-spin" /> : null} Onayla ve Kaydet
          </button>
        </div>
      </div>
    </div>
  )
}
