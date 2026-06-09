import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

interface Popup {
  id: number
  title: string
  content: string
  button_text: string
  button_link: string
  button2_text?: string
  button2_link?: string
  show_delay: number
  show_once: number
}

export default function PopupBanner() {
  const [popup, setPopup] = useState<Popup | null>(null)
  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/popups/active').then(res => {
      if (!res.data) return
      const p = res.data
      if (p.show_once && localStorage.getItem(`popup_seen_${p.id}`)) return
      setTimeout(() => {
        setPopup(p)
        setVisible(true)
      }, (p.show_delay || 3) * 1000)
    }).catch(() => {})
  }, [])

  const dismiss = () => {
    if (popup?.show_once) localStorage.setItem(`popup_seen_${popup.id}`, '1')
    setVisible(false)
    setTimeout(() => setPopup(null), 300)
  }

  if (!popup || !visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={dismiss} />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all duration-300 ${
          visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
        <h2 className="text-2xl font-bold text-[#0a2569] mb-3">{popup.title}</h2>
        <p className="text-slate-600 mb-6 leading-relaxed">{popup.content}</p>
        <div className="flex gap-3">
          <button
            onClick={() => { dismiss(); navigate(popup.button_link || '/urunler') }}
            className="flex-1 py-3 bg-[#1952d9] text-white font-semibold rounded-xl hover:bg-[#1442c0] transition-colors"
          >
            {popup.button_text}
          </button>
          {popup.button2_text && (
            <button
              onClick={dismiss}
              className="flex-1 py-3 border-2 border-slate-200 text-slate-600 font-semibold rounded-xl hover:border-slate-300 transition-colors"
            >
              {popup.button2_text}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
