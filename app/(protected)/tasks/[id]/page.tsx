import { MOCK_TASKS } from '@/lib/mock-data'
import { TaskDetailClient } from './TaskDetailClient'

export const dynamic = 'force-dynamic'

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  return <TaskDetailClient id={params.id} />
}
