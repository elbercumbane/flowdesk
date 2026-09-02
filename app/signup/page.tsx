import { signup } from '../login/actions'
import Link from 'next/link'
import { AuthBackground } from '@/components/auth-background'
import { EMAIL_PATTERN, EMAIL_TITLE } from '@/lib/email'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; returnTo?: string }>
}) {
  const { error, returnTo } = await searchParams
  const loginHref = returnTo
    ? `/login?returnTo=${encodeURIComponent(returnTo)}`
    : '/login'

  return (
    <AuthBackground>
      <form action={signup} className="fd-reveal w-full max-w-sm space-y-4 rounded-xl border bg-white p-8 shadow-lg shadow-indigo-100/50">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#818CF8] to-[#6366F1] shadow-sm shadow-indigo-300/50" />
          <span className="text-sm font-semibold tracking-tight text-zinc-900">FlowDesk</span>
        </div>
        <h1 className="text-xl font-semibold">Create a FlowDesk account</h1>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}

        <div className="space-y-1">
          <label htmlFor="fullName" className="text-sm font-medium">Full name</label>
          <input id="fullName" name="fullName" type="text" required className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition" />
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input id="email" name="email" type="text" inputMode="email" autoComplete="email" required pattern={EMAIL_PATTERN} title={EMAIL_TITLE} className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition" />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input id="password" name="password" type="password" required minLength={6} className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition" />
        </div>

        <button type="submit" className="w-full rounded-md bg-[#6366F1] py-2 text-sm font-medium text-white hover:bg-[#4F46E5] active:scale-[0.97] transition hover:shadow-lg hover:shadow-indigo-500/25">
          Create account
        </button>

        <p className="text-center text-sm text-zinc-500">
          Already have an account? <Link href={loginHref} className="text-[#6366F1] hover:underline">Sign in</Link>
        </p>
        <p className="text-center text-sm text-zinc-500">
          Or{' '}
          <Link href="/demo" className="text-[#6366F1] hover:underline">
            view the sample organization
          </Link>
        </p>
      </form>
    </AuthBackground>
  )
}
