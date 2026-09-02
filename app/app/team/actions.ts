'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { isLooseEmail } from '@/lib/email'

export async function inviteMember(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: membership } = await supabase
    .from('memberships')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership || !['owner', 'manager'].includes(membership.role)) {
    return { error: 'You do not have permission to invite' }
  }

  const email = String(formData.get('email') ?? '').trim()
  if (!isLooseEmail(email)) {
    return { error: 'Enter an email with @ and the mail server, e.g. name@company.com' }
  }
  const role = formData.get('role') as string

  const { error } = await supabase.from('invitations').insert({
    organization_id: membership.organization_id,
    email,
    role,
    invited_by: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath('/app/team')
  return { error: null }
}

export async function revokeInvitation(invitationId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('invitations').delete().eq('id', invitationId)
  if (error) throw new Error(error.message)
  revalidatePath('/app/team')
}
