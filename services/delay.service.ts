import { supabase } from '@/lib/supabase'
import type { DelayReport } from '@/types'

export async function submitDelayReason(
  taskId: string,
  workerId: string,
  reasonType: string,
  customReason?: string
): Promise<DelayReport> {
  const { data: delayReport, error: insertError } = await supabase
    .from('delay_reports')
    .insert({
      task_id: taskId,
      worker_id: workerId,
      reason_type: reasonType,
      custom_reason: customReason || null,
    })
    .select()
    .single()

  if (insertError) throw new Error(insertError.message)

  const { error: updateError } = await supabase
    .from('tasks')
    .update({ status: 'delayed', updated_at: new Date().toISOString() })
    .eq('id', taskId)

  if (updateError) throw new Error(updateError.message)

  await supabase.from('task_updates').insert({
    task_id: taskId,
    worker_id: workerId,
    status: 'delayed',
    note: `Delay reported: ${reasonType}${customReason ? ` - ${customReason}` : ''}`,
  })

  return delayReport
}
