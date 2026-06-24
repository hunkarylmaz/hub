import { useState, useEffect, useCallback } from 'react'
import { Loader2, ChevronLeft, ChevronRight, Check, X, Coffee, Pencil } from 'lucide-react'
import { api, Kurye, Vardiya } from '../../lib/api'

const DAYS_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

function getWeekDates(mondayDate: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mondayDate)
    d.setDate(d.getDate() + i)
    return d
  })
}

function getMondayOfWeek(d: Date): Date {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon = new Date(d)
  mon.setDate(d.getDate() + diff)
  mon.setHours(0, 0, 0, 0)
  return mon
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function fmtDisplay(d: Date): string {
  return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

type CellState = 'empty' | 'shift' | 'izin'

interface CellData {
  state: CellState
  baslangic: string
  bitis: string
  vardiyadId?: number
}

const DEFAULT_START = '09:00'
const DEFAULT_END = '22:00'

const TIME_OPTIONS: string[] = []
for (let h = 6; h < 24; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`)
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`)
}

export default function Vardiyalar() {
  const [kuryeler, setKuryeler] = useState<Kurye[]>([])
  const [vardiyalar, setVardiyalar] = useState<Vardiya[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [weekMonday, setWeekMonday] = useState<Date>(() => getMondayOfWeek(new Date()))
  const [editCell, setEditCell] = useState<{ kuryeId: number; dayIdx: number } | null>(null)

  const weekDates = getWeekDates(weekMonday)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [ks, vs] = await Promise.all([
        api.kuryeler.list(),
        api.vardiyalar.list({
          baslangic: fmtDate(weekDates[0]),
          bitis: fmtDate(weekDates[6]),
        }),
      ])
      setKuryeler(ks.filter(k => k.aktif))
      setVardiyalar(vs)
    } finally { setLoading(false) }
  }, [weekMonday]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData() }, [fetchData])

  function getCell(kuryeId: number, date: Date): CellData & { vardiyadId?: number } {
    const dateStr = fmtDate(date)
    const v = vardiyalar.find(x => x.kurye_id === kuryeId && x.tarih === dateStr)
    if (!v) return { state: 'empty', baslangic: DEFAULT_START, bitis: DEFAULT_END }
    if (v.izin) return { state: 'izin', baslangic: v.baslangic || DEFAULT_START, bitis: v.bitis || DEFAULT_END, vardiyadId: v.id }
    return { state: 'shift', baslangic: v.baslangic || DEFAULT_START, bitis: v.bitis || DEFAULT_END, vardiyadId: v.id }
  }

  async function cycleCell(kuryeId: number, dayIdx: number) {
    const date = weekDates[dayIdx]
    const cell = getCell(kuryeId, date)
    const key = `${kuryeId}-${dayIdx}`
    setSaving(key)

    try {
      if (cell.state === 'empty') {
        // empty → shift
        const v = await api.vardiyalar.save({ kurye_id: kuryeId, tarih: fmtDate(date), baslangic: DEFAULT_START, bitis: DEFAULT_END, izin: 0 })
        setVardiyalar(prev => [...prev.filter(x => !(x.kurye_id === kuryeId && x.tarih === fmtDate(date))), v])
      } else if (cell.state === 'shift') {
        // shift → izin
        const v = await api.vardiyalar.save({ kurye_id: kuryeId, tarih: fmtDate(date), izin: 1 })
        setVardiyalar(prev => [...prev.filter(x => !(x.kurye_id === kuryeId && x.tarih === fmtDate(date))), v])
      } else {
        // izin → empty (delete)
        if (cell.vardiyadId) {
          await api.vardiyalar.delete(cell.vardiyadId)
          setVardiyalar(prev => prev.filter(x => x.id !== cell.vardiyadId))
        }
      }
    } finally { setSaving(null) }
  }

  async function setRowIzin(kuryeId: number) {
    setSaving(`row-${kuryeId}`)
    try {
      const newVardiyalar = [...vardiyalar]
      for (const date of weekDates) {
        const dateStr = fmtDate(date)
        const existing = newVardiyalar.find(x => x.kurye_id === kuryeId && x.tarih === dateStr)
        if (existing?.izin) continue
        if (existing && !existing.izin) {
          await api.vardiyalar.delete(existing.id)
        }
        const v = await api.vardiyalar.save({ kurye_id: kuryeId, tarih: dateStr, izin: 1 })
        const idx = newVardiyalar.findIndex(x => x.kurye_id === kuryeId && x.tarih === dateStr)
        if (idx >= 0) newVardiyalar[idx] = v
        else newVardiyalar.push(v)
      }
      setVardiyalar(newVardiyalar)
    } finally { setSaving(null) }
  }

  async function updateShiftTime(kuryeId: number, dayIdx: number, field: 'baslangic' | 'bitis', val: string) {
    const date = weekDates[dayIdx]
    const cell = getCell(kuryeId, date)
    const v = await api.vardiyalar.save({
      kurye_id: kuryeId, tarih: fmtDate(date),
      baslangic: field === 'baslangic' ? val : cell.baslangic,
      bitis: field === 'bitis' ? val : cell.bitis,
      izin: 0,
    })
    setVardiyalar(prev => [...prev.filter(x => !(x.kurye_id === kuryeId && x.tarih === fmtDate(date))), v])
    setEditCell(null)
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-primary-600" /></div>

  const weekLabel = `${fmtDisplay(weekDates[0])} - ${fmtDisplay(weekDates[6])} ${weekDates[6].getFullYear()}`

  return (
    <div>
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const prev = new Date(weekMonday)
              prev.setDate(prev.getDate() - 7)
              setWeekMonday(prev)
            }}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <ChevronLeft size={16} className="text-gray-600" />
          </button>
          <span className="text-sm font-semibold text-gray-800">{weekLabel}</span>
          <button
            onClick={() => {
              const next = new Date(weekMonday)
              next.setDate(next.getDate() + 7)
              setWeekMonday(next)
            }}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <ChevronRight size={16} className="text-gray-600" />
          </button>
        </div>
        <button
          onClick={() => setWeekMonday(getMondayOfWeek(new Date()))}
          className="px-3 py-1.5 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50"
        >
          Bu Hafta
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-primary-100 border border-primary-200 flex items-center justify-center"><Check size={10} className="text-primary-600" /></div>
          <span>Vardiya</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-amber-100 border border-amber-200 flex items-center justify-center"><Coffee size={10} className="text-amber-600" /></div>
          <span>İzin</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200" />
          <span>Boş</span>
        </div>
        <span className="text-gray-300">|</span>
        <span>Hücreye tıkla: boş → vardiya → izin → boş</span>
      </div>

      {/* Grid */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-40 bg-gray-50/50">Kurye</th>
              {weekDates.map((d, i) => (
                <th key={i} className="text-center px-2 py-3 text-xs font-medium text-gray-500 min-w-[90px]">
                  <div className="text-gray-700 font-semibold">{DAYS_TR[i]}</div>
                  <div className="text-gray-400">{fmtDisplay(d)}</div>
                </th>
              ))}
              <th className="text-center px-3 py-3 text-xs font-medium text-gray-500 w-24 bg-gray-50/50">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {kuryeler.map(k => (
              <tr key={k.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/30">
                <td className="px-4 py-3 bg-gray-50/50">
                  <div className="font-medium text-gray-800 text-xs">{k.ad}</div>
                  <div className={`text-xs mt-0.5 ${
                    k.durum === 'Müsait' ? 'text-emerald-500' :
                    k.durum === 'Dağıtımda' ? 'text-blue-500' :
                    k.durum === 'Mola' ? 'text-amber-500' : 'text-gray-400'
                  }`}>{k.durum}</div>
                </td>
                {weekDates.map((d, di) => {
                  const cell = getCell(k.id, d)
                  const isEditing = editCell?.kuryeId === k.id && editCell?.dayIdx === di
                  const isSaving = saving === `${k.id}-${di}`
                  return (
                    <td key={di} className="px-2 py-2 text-center align-top">
                      {isEditing && cell.state === 'shift' ? (
                        <div className="flex flex-col gap-1 items-center" onClick={e => e.stopPropagation()}>
                          <select
                            value={cell.baslangic}
                            onChange={e => updateShiftTime(k.id, di, 'baslangic', e.target.value)}
                            className="w-full text-xs border border-gray-200 rounded px-1 py-0.5"
                          >
                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <select
                            value={cell.bitis}
                            onChange={e => updateShiftTime(k.id, di, 'bitis', e.target.value)}
                            className="w-full text-xs border border-gray-200 rounded px-1 py-0.5"
                          >
                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <button onClick={() => setEditCell(null)} className="text-xs text-gray-400 hover:text-gray-600">
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <button
                            onClick={() => cycleCell(k.id, di)}
                            disabled={isSaving}
                            className={`w-full min-h-[48px] rounded-lg border transition-colors text-xs font-medium flex flex-col items-center justify-center gap-0.5 ${
                              cell.state === 'shift'
                                ? 'bg-primary-50 border-primary-200 text-primary-700 hover:bg-primary-100'
                                : cell.state === 'izin'
                                ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                                : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'
                            }`}
                          >
                            {isSaving ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : cell.state === 'shift' ? (
                              <>
                                <span>{cell.baslangic}</span>
                                <span className="text-gray-400">—</span>
                                <span>{cell.bitis}</span>
                              </>
                            ) : cell.state === 'izin' ? (
                              <><Coffee size={14} /><span>İzin</span></>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </button>
                          {cell.state === 'shift' && !isSaving && (
                            <button
                              onClick={e => { e.stopPropagation(); setEditCell({ kuryeId: k.id, dayIdx: di }) }}
                              className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-primary-600 hover:border-primary-300"
                              title="Saati düzenle"
                            >
                              <Pencil size={10} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  )
                })}
                <td className="px-3 py-2 bg-gray-50/50 text-center">
                  <button
                    onClick={() => setRowIzin(k.id)}
                    disabled={saving === `row-${k.id}`}
                    className="text-xs text-amber-600 hover:text-amber-700 font-medium whitespace-nowrap"
                    title="Tüm haftayı izin yap"
                  >
                    {saving === `row-${k.id}` ? <Loader2 size={12} className="animate-spin mx-auto" /> : 'Hepsini İzin'}
                  </button>
                </td>
              </tr>
            ))}
            {kuryeler.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">
                  Aktif kurye bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-gray-400">
        Vardiya hücrelerine tıklayarak döngü oluşturabilirsiniz: boş → vardiya → izin → boş. Vardiya saatini değiştirmek için hücredeki kalem simgesine tıklayın. Değişiklikler anlık kaydedilir.
      </p>
    </div>
  )
}
