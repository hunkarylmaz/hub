interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  withSubtitle?: boolean
}

export default function Logo({ size = 'md', withSubtitle = true }: LogoProps) {
  const h = size === 'lg' ? 'h-12' : size === 'sm' ? 'h-7' : 'h-9'
  return (
    <div className="flex items-center gap-3">
      <img src="/logo.png" alt="paketciniz" className={`${h} w-auto object-contain`} />
      {withSubtitle && (
        <div className="border-l border-gray-200 pl-3">
          <p className="text-sm font-bold text-gray-900 leading-tight">İK & Vardiya</p>
          <p className="text-xs text-gray-400 leading-tight">Yönetim Sistemi</p>
        </div>
      )}
    </div>
  )
}
