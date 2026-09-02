'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createCustomer(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!membership) {
    redirect('/app/customers/new?error=Sem+organização+associada')
  }

  const { error } = await supabase.from('customers').insert({
    organization_id: membership.organization_id,
    name: formData.get('name') as string,
    company: (formData.get('company') as string) || null,
    email: (formData.get('email') as string) || null,
    phone: (formData.get('phone') as string) || null,
    status: (formData.get('status') as string) || 'active',
    notes: (formData.get('notes') as string) || null,
  })

  if (error) {
    redirect(`/app/customers/new?error=${encodeURIComponent(error.message)}`)
  }

  redirect(`/app/customers?toast=${encodeURIComponent('Cliente criado')}`)
}
