'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createTask(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!membership) redirect('/app/tasks/new?error=Sem+organização')

  const dealId = formData.get('dealId') as string
  const customerId = formData.get('customerId') as string
  const dueDate = formData.get('dueDate') as string

  const { error } = await supabase.from('tasks').insert({
    organization_id: membership.organization_id,
    title: formData.get('title') as string,
    deal_id: dealId || null,
    customer_id: customerId || null,
    due_date: dueDate || null,
    status: 'todo',
  })

  if (error) redirect(`/app/tasks/new?error=${encodeURIComponent(error.message)}`)
  redirect(`/app/tasks?toast=${encodeURIComponent('Tarefa criada')}`)
}

export async function updateTaskStatus(taskId: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tasks')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', taskId)

  if (error) throw new Error(error.message)
  revalidatePath('/app/tasks')
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)
  if (error) throw new Error(error.message)
  revalidatePath('/app/tasks')
}
