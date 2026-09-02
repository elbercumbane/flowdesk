'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createDeal(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!membership) redirect('/app/deals/new?error=No+organization+found')

  const { error } = await supabase.from('deals').insert({
    organization_id: membership.organization_id,
    customer_id: formData.get('customerId') as string,
    title: formData.get('title') as string,
    value: parseFloat((formData.get('value') as string) || '0'),
    stage: (formData.get('stage') as string) || 'lead',
    notes: (formData.get('notes') as string) || null,
  })

  if (error) redirect(`/app/deals/new?error=${encodeURIComponent(error.message)}`)
  redirect(`/app/deals?toast=${encodeURIComponent('Deal created')}`)
}

export async function updateDealStage(dealId: string, newStage: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('deals')
    .update({ stage: newStage, updated_at: new Date().toISOString() })
    .eq('id', dealId)

  if (error) throw new Error(error.message)
  revalidatePath('/app/deals')
}
