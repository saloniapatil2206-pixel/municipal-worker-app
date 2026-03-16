import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  message: string
  icon?: LucideIcon
  subText?: string
}

export default function EmptyState({ message, icon: Icon, subText }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Icon size={28} className="text-gray-400" />
        </div>
      )}
      <p className="text-gray-700 font-semibold text-base">{message}</p>
      {subText && <p className="text-gray-400 text-sm mt-1">{subText}</p>}
    </div>
  )
}
