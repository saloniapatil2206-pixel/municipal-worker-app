import { MOCK_TASKS } from '@/lib/mock-data'

export function generateStaticParams() {
  return MOCK_TASKS.map((task) => ({
    id: task.id,
  }))
}

export default function TaskDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
