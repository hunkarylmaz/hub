import { Menu, ChevronDown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface TopbarProps {
  onMenuToggle: () => void
}

function getInitials(ad: string): string {
  return ad
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function Topbar({ onMenuToggle }: TopbarProps) {
  const { user } = useAuth()

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center font-bold text-white text-lg">
            P
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-gray-800 text-base leading-none">Paketçi</span>
            <span className="text-xs text-gray-400 leading-none">app</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 cursor-pointer group">
        <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-sm">
          {user ? getInitials(user.ad) : 'U'}
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-semibold text-gray-800 text-sm leading-none">
            {user ? user.ad : '—'}
          </span>
          <span className="text-xs text-gray-400 leading-none mt-0.5">
            {user ? user.rol : '—'}
          </span>
        </div>
        <ChevronDown size={16} className="text-gray-400 group-hover:text-gray-600" />
      </div>
    </header>
  )
}
