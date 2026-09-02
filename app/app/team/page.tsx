import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TeamView } from './team-view'

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: myMembership } = await supabase
    .from('memberships')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!myMembership) redirect('/onboarding')

  const [{ data: members }, { data: invitations }] = await Promise.all([
    supabase
      .from('memberships')
      .select('id, role, user_id, profiles(full_name, email)')
      .eq('organization_id', myMembership.organization_id),
    supabase
      .from('invitations')
      .select('id, email, role, status, created_at')
      .eq('organization_id', myMembership.organization_id)
      .eq('status', 'pending'),
  ])

  const canManage = ['owner', 'manager'].includes(myMembership.role)

  return (
    <TeamView
      members={members ?? []}
      invitations={invitations ?? []}
      canManage={canManage}
      currentUserId={user.id}
    />
  )
}
