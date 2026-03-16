import { LucideIcon } from 'lucide-react'
import clsx from 'clsx'

interface MetricCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color: 'blue' | 'green' | 'amber' | 'red' | 'indigo' | 'gray'
}

const colorMap = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  gray: 'bg-gray-50 text-gray-600',
}

const iconBgMap = {
  blue: 'bg-blue-100',
  green: 'bg-green-100',
  amber: 'bg-amber-100',
  red: 'bg-red-100',
  indigo: 'bg-indigo-100',
  gray: 'bg-gray-100',
}

export default function MetricCard({ title, value, icon: Icon, color }: MetricCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-2">
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', iconBgMap[color])}>
          <Icon size={20} className={colorMap[color].split(' ')[1]} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{title}</p>
    </div>
  )
}
