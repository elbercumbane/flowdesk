import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { logout } from '@/app/login/logout'
import { DEMO_COOKIE } from '@/lib/demo'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const cookieStore = await cookies()
  const isDemo =
    cookieStore.get(DEMO_COOKIE)?.value === '1' ||
    user.email === process.env.DEMO_EMAIL

  const { data: membership } = await supabase
    .from('memberships')
    .select('role, organizations(name, slug)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const org = membership?.organizations as { name?: string; slug?: string } | { name?: string; slug?: string }[] | null
  const orgName = (Array.isArray(org) ? org[0]?.name : org?.name) || '—'
  const orgSlug = (Array.isArray(org) ? org[0]?.slug : org?.slug) || '—'
  const role = membership?.role || '—'

  return (
    <div className="p-4 sm:p-6 max-w-xl">
      <h1 className="text-lg sm:text-xl font-semibold text-zinc-900 mb-4 sm:mb-6">Settings</h1>

      <div className="fd-reveal space-y-4">
        <div className="rounded-xl border bg-white p-4 sm:p-6">
          <p className="text-xs font-medium text-zinc-500 mb-3">Account</p>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-zinc-400">Email</p>
              <p className="text-zinc-900">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">User ID</p>
              <p className="truncate text-zinc-700">{user.id}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4 sm:p-6">
          <p className="text-xs font-medium text-zinc-500 mb-3">Organization</p>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-zinc-400">Name</p>
              <p className="text-zinc-900">{orgName}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">Slug</p>
              <p className="text-zinc-700">{orgSlug}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">Your role</p>
              <p className="capitalize text-zinc-900">{role}</p>
            </div>
          </div>
        </div>

        {isDemo ? (
          <div className="rounded-xl border border-dashed border-indigo-200 bg-white p-4 sm:p-6">
            <p className="text-sm text-zinc-600">
              You&apos;re in the sample organization. Create your own account to change settings.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <a href="/demo/exit?to=login" className="text-sm font-medium text-[#4F46E5] hover:underline">
                Sign in to your account
              </a>
              <a href="/demo/exit?to=signup" className="text-sm font-medium text-[#4F46E5] hover:underline">
                Create a new account
              </a>
            </div>
          </div>
        ) : (
          <form action={logout} className="rounded-xl border bg-white p-4 sm:p-6">
            <p className="text-sm text-zinc-600 mb-3">Sign out of this device.</p>
            <button
              type="submit"
              className="rounded-md border px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Sign out
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
