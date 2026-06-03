import { useState, useRef, useEffect } from 'react'
import { QrCode, Camera, X, CheckCircle2, Loader2, MapPin, Package, ChevronRight, AlertCircle } from 'lucide-react'
import { api, Is } from '../../lib/api'

type Aksiyon = 'al' | 'yolda' | 'teslim'

const AKSIYON_CONFIG: Record<Aksiyon, { label: string; color: string; description: string }> = {
  al:     { label: 'Paketi Aldım',     color: 'bg-amber-500 hover:bg-amber-600',   description: 'İşi havuzdan alarak üstleniyorum' },
  yolda:  { label: 'Yola Çıktım',      color: 'bg-blue-600 hover:bg-blue-700',     description: 'Paketi alıp yola çıktım' },
  teslim: { label: 'Teslim Ettim',     color: 'bg-emerald-600 hover:bg-emerald-700', description: 'Paketi alıcıya teslim ettim' },
}

function availableAksiyonlar(is: Is): Aksiyon[] {
  if (is.durum === 'Havuzda') return ['al']
  if (is.durum === 'Alındı')  return ['yolda']
  if (is.durum === 'Yolda')   return ['teslim']
  return []
}

export default function TasiyiciQrTara() {
  const [input, setInput] = useState('')
  const [scanning, setScanning] = useState(false)
  const [loadingJob, setLoadingJob] = useState(false)
  const [job, setJob] = useState<Is | null>(null)
  const [lookupErr, setLookupErr] = useState('')
  const [actionResult, setActionResult] = useState<{ yeni_durum: string } | null>(null)
  const [executing, setExecuting] = useState(false)
  const [execErr, setExecErr] = useState('')

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<number | null>(null)

  useEffect(() => {
    return () => stopCamera()
  }, [])

  function stopCamera() {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setScanning(false)
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setScanning(true)

      // Use BarcodeDetector if available
      if ('BarcodeDetector' in window) {
        const detector = new (window as unknown as { BarcodeDetector: new (opts: Record<string,unknown>) => { detect: (el: HTMLVideoElement) => Promise<{rawValue: string}[]> } }).BarcodeDetector({ formats: ['qr_code'] })
        scanIntervalRef.current = window.setInterval(async () => {
          if (!videoRef.current) return
          try {
            const results = await detector.detect(videoRef.current)
            if (results.length > 0) {
              const code = results[0].rawValue
              stopCamera()
              setInput(code)
              lookupJob(code)
            }
          } catch {}
        }, 400)
      }
    } catch {
      alert('Kamera erişimi sağlanamadı. Lütfen manuel giriş yapın.')
    }
  }

  async function lookupJob(code: string) {
    const qr = (code || input).trim()
    if (!qr) return
    setJob(null); setLookupErr(''); setActionResult(null); setExecErr('')
    setLoadingJob(true)
    try {
      const data = await api.tasiyici.isByQr(qr)
      setJob(data)
    } catch (e) {
      setLookupErr((e as Error).message)
    } finally {
      setLoadingJob(false)
    }
  }

  async function executeAksiyon(aksiyon: Aksiyon) {
    if (!job) return
    setExecuting(true); setExecErr('')
    try {
      const result = await api.tasiyici.qrTara(job.qr_kodu, aksiyon)
      setActionResult(result)
      setJob(null)
      setInput('')
    } catch (e) {
      setExecErr((e as Error).message)
    } finally {
      setExecuting(false)
    }
  }

  const aksiyonlar = job ? availableAksiyonlar(job) : []

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">QR Kod Tara</h1>
        <p className="text-sm text-gray-500 mt-0.5">Paketi alırken veya teslim ederken QR kodu okutun</p>
      </div>

      {/* Success result */}
      {actionResult && (
        <div className="card p-6 text-center border-2 border-emerald-200 bg-emerald-50">
          <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-3" />
          <p className="text-lg font-bold text-emerald-700">İşlem Başarılı</p>
          <p className="text-sm text-emerald-600 mt-1">Yeni durum: <strong>{actionResult.yeni_durum}</strong></p>
          <button onClick={() => setActionResult(null)} className="mt-4 btn-secondary">
            Yeni QR Tara
          </button>
        </div>
      )}

      {!actionResult && (
        <>
          {/* Camera or manual input */}
          {scanning ? (
            <div className="card overflow-hidden">
              <div className="relative bg-black aspect-video">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-white rounded-2xl opacity-70">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
                  </div>
                </div>
                <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-white/80 font-medium">
                  QR kodu çerçeve içine alın
                </p>
              </div>
              <div className="p-4 flex items-center justify-between">
                <span className="text-sm text-gray-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Kamera aktif
                </span>
                <button onClick={stopCamera} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
                  <X size={14} /> Kapat
                </button>
              </div>
            </div>
          ) : (
            <div className="card p-5">
              <p className="text-sm font-semibold text-gray-700 mb-3">QR Kod Girin</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && lookupJob(input)}
                  placeholder="PLU-... kodunu yapıştırın veya girin"
                  className="input-field flex-1"
                />
                <button
                  onClick={() => lookupJob(input)}
                  disabled={loadingJob || !input.trim()}
                  className="btn-primary px-4 shrink-0"
                >
                  {loadingJob ? <Loader2 size={16} className="animate-spin" /> : 'Ara'}
                </button>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">veya</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <button
                onClick={startCamera}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Camera size={16} /> Kamera ile Tara
              </button>
            </div>
          )}

          {/* Lookup error */}
          {lookupErr && (
            <div className="card p-4 border border-red-200 bg-red-50 flex items-center gap-3">
              <AlertCircle size={18} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-600">{lookupErr}</p>
            </div>
          )}

          {/* Job found */}
          {job && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                <QrCode size={16} className="text-gray-400" />
                <p className="text-sm font-bold text-gray-700">İş Bulundu</p>
                <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full ${
                  job.durum === 'Havuzda'        ? 'bg-sky-50 text-sky-700' :
                  job.durum === 'Alındı'         ? 'bg-amber-50 text-amber-700' :
                  job.durum === 'Yolda'          ? 'bg-blue-50 text-blue-700' :
                  job.durum === 'Teslim Edildi'  ? 'bg-emerald-50 text-emerald-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {job.durum}
                </span>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Package size={16} className="text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-700">
                    <span className="font-semibold">#{String(job.id).padStart(4,'0')}</span>
                    <span className="text-gray-400 mx-1.5">·</span>
                    {job.paket_boyutu}
                    {job.partner_firma && <><span className="text-gray-400 mx-1.5">·</span>{job.partner_firma}</>}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-gray-700">{job.alis_il} / {job.alis_ilce}</p>
                    <p className="text-gray-500 text-xs">{job.alis_adres}</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-gray-700">{job.birakilis_il} / {job.birakilis_ilce}</p>
                    <p className="text-gray-500 text-xs">{job.birakilis_adres}</p>
                  </div>
                </div>
              </div>

              {aksiyonlar.length > 0 ? (
                <div className="px-5 pb-5 space-y-2">
                  {execErr && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle size={14} /> {execErr}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mb-2">Bu işle ne yapmak istiyorsunuz?</p>
                  {aksiyonlar.map(a => {
                    const cfg = AKSIYON_CONFIG[a]
                    return (
                      <button
                        key={a}
                        onClick={() => executeAksiyon(a)}
                        disabled={executing}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50 ${cfg.color}`}
                      >
                        <span>{cfg.label}</span>
                        <span className="text-white/70 text-xs">{cfg.description}</span>
                        {executing && <Loader2 size={14} className="animate-spin ml-2" />}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="px-5 pb-5">
                  <p className="text-sm text-gray-400 italic">Bu iş için yapılabilecek işlem yok ({job.durum})</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Info */}
      {!job && !actionResult && !lookupErr && (
        <div className="grid grid-cols-3 gap-3 text-center">
          {(['al', 'yolda', 'teslim'] as Aksiyon[]).map((a, i) => (
            <div key={a} className="card p-3">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 mx-auto mb-2">
                {i + 1}
              </div>
              <p className="text-xs font-semibold text-gray-600">{AKSIYON_CONFIG[a].label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{
                a === 'al' ? 'Havuzdan al' : a === 'yolda' ? 'Yola çık' : 'Teslim et'
              }</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
