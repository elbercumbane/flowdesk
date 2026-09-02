import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AcceptInviteButton } from './accept-button'
import { AuthBackground } from '@/components/auth-background'

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?returnTo=/invite/${token}`)
  }

  const { data: invitation } = await supabase
    .from('invitations')
    .select('email, role, status, organizations(name)')
    .eq('id', token)
    .single()

  if (!invitation || invitation.status !== 'pending') {
    return (
      <AuthBackground>
        <div className="fd-reveal w-full max-w-sm rounded-xl border bg-white p-8 text-center shadow-lg shadow-indigo-100/50">
          <p className="text-sm text-zinc-500">This invitation is invalid or has already been used.</p>
        </div>
      </AuthBackground>
    )
  }

  const orgName = Array.isArray(invitation.organizations)
    ? invitation.organizations[0]?.name
    : (invitation.organizations as any)?.name

  return (
    <AuthBackground>
      <div className="fd-reveal w-full max-w-sm space-y-4 rounded-xl border bg-white p-8 text-center shadow-lg shadow-indigo-100/50">
        <h1 className="text-lg font-semibold">Invitation to {orgName}</h1>
        <p className="text-sm text-zinc-500">
          You&apos;ve been invited to join as <strong>{invitation.role}</strong>.
        </p>
        <AcceptInviteButton token={token} />
      </div>
    </AuthBackground>
  )
}
