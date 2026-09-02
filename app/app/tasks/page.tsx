import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TasksView } from './tasks-view'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('id, title, status, due_date, deal_id, customer_id, deals(title), customers(name)')
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="p-6 text-sm text-red-600">Failed to load tasks: {error.message}</div>
  }

  return <TasksView initialTasks={tasks ?? []} />
}
