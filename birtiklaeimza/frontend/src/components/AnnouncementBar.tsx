import { useState, useEffect } from 'react'
import { X, Megaphone } from 'lucide-react'
import api from '../lib/api'

interface Announcement {
  id: number
  text: string
  link?: string
  linkText?: string
  color?: string
}

export default function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const response = await api.get('/announcements/active')
        if (response.data) {
          setAnnouncement(response.data)
        }
      } catch {
        // Fallback announcement
        setAnnouncement({
          id: 1,
          text: 'Yaz kampanyası! Tüm e-imza paketlerinde %20 indirim fırsatı.',
          link: '/urunler',
          linkText: 'Hemen İncele',
          color: 'blue',
        })
      }
    }
    fetchAnnouncement()
  }, [])

  if (!announcement || dismissed) return null

  return (
    <div className="relative bg-gradient-to-r from-[#0a2569] via-[#1952d9] to-[#0ea5e9] text-white py-2.5 px-4 text-center text-sm font-medium z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
        <Megaphone className="w-4 h-4 flex-shrink-0 text-yellow-300" />
        <span className="text-white/95">{announcement.text}</span>
        {announcement.link && announcement.linkText && (
          <a
            href={announcement.link}
            className="underline font-semibold text-yellow-300 hover:text-yellow-200 transition-colors flex-shrink-0"
          >
            {announcement.linkText} &rarr;
          </a>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
        aria-label="Kapat"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
