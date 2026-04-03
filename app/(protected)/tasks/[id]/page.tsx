import { MOCK_TASKS } from '@/lib/mock-data'
import { TaskDetailClient } from './TaskDetailClient'



export async function generateStaticParams() {
  return MOCK_TASKS.map(task => ({
    id: task.id,
  }))
}

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  return <TaskDetailClient id={params.id} />
}
