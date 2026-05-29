import { Clock } from 'lucide-react'

export default function MolaYonetim() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
        <Clock size={26} className="text-gray-400" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-gray-600">Mola Yönetimi</p>
        <p className="text-sm mt-1">Bu özellik yakında kullanıma açılacak</p>
      </div>
    </div>
  )
}
