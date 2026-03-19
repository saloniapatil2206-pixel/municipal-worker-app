import { MOCK_TASKS } from '@/lib/mock-data'

export async function generateStaticParams() {
  return MOCK_TASKS.map((task) => ({
    id: task.id,
  }))
}

export default function TaskLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
