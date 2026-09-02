'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { UserPlus, X, Copy, Check } from 'lucide-react'
import { inviteMember, revokeInvitation } from './actions'
import { EMAIL_PATTERN, EMAIL_TITLE } from '@/lib/email'

function relField(rel: any, key: string) {
  if (!rel) return null
  const obj = Array.isArray(rel) ? rel[0] : rel
  return obj?.[key] ?? null
}

const roleLabels: Record<string, string> = { owner: 'Owner', manager: 'Manager', member: 'Member' }

export function TeamView({
  members,
  invitations,
  canManage,
  currentUserId,
}: {
  members: any[]
  invitations: any[]
  canManage: boolean
  currentUserId: string
}) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  async function handleInvite(formData: FormData) {
    setError(null)
    const result = await inviteMember(formData)
    if (result?.error) {
      setError(result.error)
      return
    }
    setShowForm(false)
    toast.success('Member invited')
    router.refresh()
  }

  function copyLink(invitationId: string) {
    const url = `${window.location.origin}/invite/${invitationId}`
    navigator.clipboard.writeText(url)
    setCopiedId(invitationId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl font-semibold text-zinc-900">Team</h1>
        {canManage && (
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-1.5 rounded-md bg-[#6366F1] px-3 py-2 text-sm font-medium text-white hover:bg-[#4F46E5] active:scale-[0.97] transition hover:shadow-lg hover:shadow-indigo-500/25"
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Invite</span>
          </button>
        )}
      </div>

      {showForm && (
        <div className="fd-reveal rounded-xl border bg-white p-4 mb-4">
          {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <form action={handleInvite} className="flex flex-col sm:flex-row gap-3">
            <input
              name="email"
              type="text"
              inputMode="email"
              autoComplete="email"
              required
              pattern={EMAIL_PATTERN}
              title={EMAIL_TITLE}
              placeholder="email@example.com"
              className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
            />
            <select name="role" defaultValue="member" className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition">
              <option value="member">Member</option>
              <option value="manager">Manager</option>
            </select>
            <button type="submit" className="rounded-md bg-[#6366F1] px-4 py-2 text-sm font-medium text-white hover:bg-[#4F46E5] active:scale-[0.97] transition hover:shadow-lg hover:shadow-indigo-500/25">
              Invite
            </button>
          </form>
        </div>
      )}

      <p className="text-xs font-medium text-zinc-500 mb-2">Members ({members.length})</p>
      <div className="fd-stagger rounded-xl border bg-white overflow-hidden mb-6">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-3 border-b last:border-0 transition-colors hover:bg-zinc-50/70">
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-900 truncate">
                {relField(m.profiles, 'full_name') || relField(m.profiles, 'email') || 'No name'}
                {m.user_id === currentUserId && <span className="text-zinc-400 font-normal"> (you)</span>}
              </p>
              <p className="text-xs text-zinc-500 truncate">{relField(m.profiles, 'email')}</p>
            </div>
            <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
              {roleLabels[m.role]}
            </span>
          </div>
        ))}
      </div>

      {invitations.length > 0 && (
        <>
          <p className="text-xs font-medium text-zinc-500 mb-2">Pending invitations ({invitations.length})</p>
          <div className="fd-stagger rounded-xl border bg-white overflow-hidden">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-3 px-4 py-3 border-b last:border-0 transition-colors hover:bg-zinc-50/70">
                <div className="min-w-0">
                  <p className="text-sm text-zinc-900 truncate">{inv.email}</p>
                  <p className="text-xs text-zinc-500">{roleLabels[inv.role]}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => copyLink(inv.id)}
                    className="flex items-center gap-1 text-xs text-[#6366F1] hover:underline"
                  >
                    {copiedId === inv.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedId === inv.id ? 'Copied' : 'Copy link'}
                  </button>
                  {canManage && (
                    <button
                      onClick={() =>
                        startTransition(async () => {
                          await revokeInvitation(inv.id)
                          router.refresh()
                        })
                      }
                      className="text-zinc-300 hover:text-red-600"
                      aria-label="Revoke invitation"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
