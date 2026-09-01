import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AcceptInviteButton } from './accept-button'

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
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] p-4">
        <p className="text-sm text-zinc-500">Este convite não é válido ou já foi utilizado.</p>
      </div>
    )
  }

  const orgName = Array.isArray(invitation.organizations)
    ? invitation.organizations[0]?.name
    : (invitation.organizations as any)?.name

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] p-4">
      <div className="w-full max-w-sm rounded-xl border bg-white p-8 text-center space-y-4">
        <h1 className="text-lg font-semibold">Convite para {orgName}</h1>
        <p className="text-sm text-zinc-500">
          Foste convidado para entrar como <strong>{invitation.role}</strong>.
        </p>
        <AcceptInviteButton token={token} />
      </div>
    </div>
  )
}
