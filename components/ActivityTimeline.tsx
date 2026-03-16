import { formatTimeAgo } from '@/utils/formatDate'
import type { TaskUpdate } from '@/types'
import { statusLabels } from '@/utils/statusColors'
import type { TaskStatus } from '@/types'
import { CheckCircle2, Clock, AlertCircle, Play, FileText } from 'lucide-react'

const statusIcons: Record<string, React.ReactNode> = {
  assigned: <Clock size={14} className="text-blue-500" />,
  accepted: <CheckCircle2 size={14} className="text-indigo-500" />,
  in_progress: <Play size={14} className="text-amber-500" />,
  completed: <CheckCircle2 size={14} className="text-green-500" />,
  delayed: <AlertCircle size={14} className="text-red-500" />,
}

interface ActivityTimelineProps {
  updates: TaskUpdate[]
}

export default function ActivityTimeline({ updates }: ActivityTimelineProps) {
  if (updates.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-4">No activity yet</p>
  }

  return (
    <div className="relative pl-5">
      {/* Vertical line */}
      <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200" />
      <div className="space-y-4">
        {updates.map((update, i) => (
          <div key={update.id} className="relative flex gap-3">
            {/* Dot */}
            <div className="absolute -left-3.5 mt-0.5 w-5 h-5 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center z-10">
              {update.status ? statusIcons[update.status] || <FileText size={12} className="text-gray-400" /> : <FileText size={12} className="text-gray-400" />}
            </div>
            <div className="ml-4 flex-1">
              {update.status && (
                <p className="text-xs font-semibold text-gray-700">
                  Status changed to {statusLabels[update.status as TaskStatus] || update.status}
                </p>
              )}
              {update.note && (
                <p className="text-xs text-gray-600 mt-0.5">{update.note}</p>
              )}
              <p className="text-[11px] text-gray-400 mt-1">{formatTimeAgo(update.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
