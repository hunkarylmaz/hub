import { useState, useEffect, useCallback } from 'react'
import { Loader2, Send, Bell, Users, User, Clock } from 'lucide-react'
import { api, Kurye, BayiBildirim } from '../../lib/api'

type HedefTip = 'toplu' | 'ozel'

export default function Bildirimler() {
  const [kuryeler, setKuryeler] = useState<Kurye[]>([])
  const [gecmis, setGecmis] = useState<BayiBildirim[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Form
  const [hedef, setHedef] = useState<HedefTip>('toplu')
  const [secilenKurye, setSecilenKurye] = useState<number | null>(null)
  const [baslik, setBaslik] = useState('')
  const [mesaj, setMesaj] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [ks, bs] = await Promise.all([api.kuryeler.list(), api.bildirimler.list()])
      setKuryeler(ks.filter(k => k.aktif))
      setGecmis(bs)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!baslik.trim() || !mesaj.trim()) { setError('Başlık ve mesaj zorunlu'); return }
    if (hedef === 'ozel' && !secilenKurye) { setError('Kurye seçin'); return }
    setSending(true); setSuccess(''); setError('')
    try {
      const b = await api.bildirimler.send({
        baslik,
        mesaj,
        kurye_id: hedef === 'ozel' ? secilenKurye : null,
      })
      setGecmis(prev => [b, ...prev])
      const hedefAd = hedef === 'toplu' ? 'tüm kuryeler' : kuryeler.find(k => k.id === secilenKurye)?.ad || 'kurye'
      setSuccess(`Bildirim gönderildi → ${hedefAd}`)
      setBaslik(''); setMesaj('')
      setTimeout(() => setSuccess(''), 4000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gönderilemedi')
    } finally { setSending(false) }
  }

  function fmtTime(s: string) {
    try {
      const d = new Date(s)
      return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }) + ' ' +
        d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    } catch { return s }
  }

  return (
    <div className="space-y-5">
      {/* Send Form */}
      <form onSubmit={handleSend} className="bg-white rounded-xl border border-gray-100 p-5 space-y-4 max-w-xl">
        <div className="flex items-center gap-2 mb-1">
          <Bell size={15} className="text-primary-600" />
          <h2 className="font-semibold text-gray-800">Bildirim Gönder</h2>
        </div>

        {success && <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-emerald-700">{success}</div>}
        {error && <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>}

        {/* Hedef seçimi */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Kime gönderilecek?</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { setHedef('toplu'); setSecilenKurye(null) }}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-colors ${hedef === 'toplu' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              <Users size={16} />
              <span className="text-sm font-medium">Tüm Kuryeler</span>
            </button>
            <button
              type="button"
              onClick={() => setHedef('ozel')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-colors ${hedef === 'ozel' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              <User size={16} />
              <span className="text-sm font-medium">Belirli Kurye</span>
            </button>
          </div>
        </div>

        {hedef === 'ozel' && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Kurye Seç</label>
            <select
              value={secilenKurye ?? ''}
              onChange={e => setSecilenKurye(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
            >
              <option value="">— Kurye seçin —</option>
              {kuryeler.map(k => (
                <option key={k.id} value={k.id}>{k.ad} ({k.durum})</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Bildirim Başlığı</label>
          <input
            required
            value={baslik}
            onChange={e => setBaslik(e.target.value)}
            placeholder="Örn: Önemli Duyuru"
            maxLength={80}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Mesaj</label>
          <textarea
            required
            value={mesaj}
            onChange={e => setMesaj(e.target.value)}
            placeholder="Kurye(ler)e iletilecek mesajı yazın..."
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 resize-none"
          />
          <div className="flex justify-end text-xs text-gray-300 mt-0.5">{mesaj.length}/500</div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-gray-400">
            {hedef === 'toplu'
              ? `${kuryeler.length} aktif kurye`
              : secilenKurye ? kuryeler.find(k => k.id === secilenKurye)?.ad : 'Kurye seçilmedi'}
          </p>
          <button
            type="submit"
            disabled={sending}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-60"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {sending ? 'Gönderiliyor...' : 'Gönder'}
          </button>
        </div>
      </form>

      {/* Gönderim Geçmişi */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Clock size={14} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-700">Gönderim Geçmişi</h3>
          {gecmis.length > 0 && <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{gecmis.length}</span>}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10"><Loader2 size={22} className="animate-spin text-primary-600" /></div>
        ) : gecmis.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">Henüz bildirim gönderilmedi</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {gecmis.map(b => (
              <div key={b.id} className="px-5 py-3.5 flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${b.kurye_id ? 'bg-blue-50' : 'bg-primary-50'}`}>
                  {b.kurye_id ? <User size={13} className="text-blue-500" /> : <Users size={13} className="text-primary-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-800 truncate">{b.baslik}</p>
                    <span className="text-xs text-gray-400 shrink-0">{fmtTime(b.olusturma_tarihi)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{b.mesaj}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {b.kurye_id ? (b.kurye_ad || 'Kurye') : 'Tüm kuryeler'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
