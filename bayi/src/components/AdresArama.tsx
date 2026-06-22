import { useState, useRef, useEffect } from 'react'
import { Search, Loader2, MapPin } from 'lucide-react'
import { api, AdresSonucu } from '../lib/api'

interface AdresAramaProps {
  onSecim: (sonuc: AdresSonucu) => void
  placeholder?: string
  searchFn?: (q: string) => Promise<AdresSonucu[]>
}

export default function AdresArama({ onSecim, placeholder = 'Mahalle, sokak veya açık adres yazın...', searchFn = api.geocode.ara }: AdresAramaProps) {
  const [text, setText] = useState('')
  const [sonuclar, setSonuclar] = useState<AdresSonucu[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const reqId = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (text.trim().length < 3) {
      setSonuclar([])
      setLoading(false)
      return
    }
    setLoading(true)
    const id = ++reqId.current
    timer.current = setTimeout(async () => {
      try {
        const r = await searchFn(text)
        if (reqId.current === id) {
          setSonuclar(r)
          setOpen(true)
        }
      } finally {
        if (reqId.current === id) setLoading(false)
      }
    }, 500)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [text])

  return (
    <div className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onFocus={() => sonuclar.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
        />
        {loading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}
      </div>
      {open && sonuclar.length > 0 && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20 max-h-60 overflow-y-auto">
            {sonuclar.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { onSecim(s); setText(s.display_name); setOpen(false) }}
                className="w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-gray-50"
              >
                <MapPin size={13} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-800 leading-snug">{s.display_name}</p>
                  {(s.mahalle || s.ilce) && (
                    <p className="text-[11px] text-gray-400 mt-0.5">{[s.mahalle, s.ilce, s.il].filter(Boolean).join(' · ')}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
