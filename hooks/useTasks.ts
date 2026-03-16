'use client'
import { useState, useEffect, useCallback } from 'react'
import { fetchAssignedTasks } from '@/services/task.service'
import type { Task, TaskStatus } from '@/types'

interface UseTasksReturn {
  tasks: Task[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useTasks(workerId: string | undefined, filterStatus?: TaskStatus): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    if (!workerId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAssignedTasks(workerId)
      const filtered = filterStatus
        ? data.filter((t) => t.status === filterStatus)
        : data
      setTasks(filtered)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [workerId, filterStatus])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  return { tasks, loading, error, refetch: fetchTasks }
}
