import { Bike } from 'lucide-react'

interface LogoProps {
  dark?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function Logo({ dark, size = 'md' }: LogoProps) {
  const text = dark ? 'text-white' : 'text-gray-900'
  const accent = 'text-blue-500'
  const sub = dark ? 'text-gray-400' : 'text-gray-500'
  const iconSize = size === 'lg' ? 24 : size === 'sm' ? 14 : 18

  return (
    <div className="flex items-center gap-2.5">
      <div className={`flex items-center justify-center rounded-xl ${
        size === 'lg' ? 'w-12 h-12' : size === 'sm' ? 'w-7 h-7' : 'w-9 h-9'
      } bg-blue-600 shadow-sm`}>
        <Bike size={iconSize} className="text-white" />
      </div>
      <div>
        <p className={`font-black leading-none tracking-tight ${text} ${
          size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-sm' : 'text-base'
        }`}>
          paket<span className={accent}>çiniz</span>
        </p>
        <p className={`text-xs font-semibold leading-tight ${sub}`}>Plus</p>
      </div>
    </div>
  )
}
