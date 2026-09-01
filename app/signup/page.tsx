import { signup } from '../login/actions'
import Link from 'next/link'

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
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
      <form action={signup} className="w-full max-w-sm space-y-4 rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold">Criar conta no FlowDesk</h1>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}

        <div className="space-y-1">
          <label htmlFor="fullName" className="text-sm font-medium">Nome completo</label>
          <input id="fullName" name="fullName" type="text" required className="w-full rounded-md border px-3 py-2 text-sm" />
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input id="email" name="email" type="email" required className="w-full rounded-md border px-3 py-2 text-sm" />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input id="password" name="password" type="password" required minLength={6} className="w-full rounded-md border px-3 py-2 text-sm" />
        </div>

        <button type="submit" className="w-full rounded-md bg-[#6366F1] py-2 text-sm font-medium text-white hover:bg-[#4F46E5]">
          Criar conta
        </button>

        <p className="text-center text-sm text-zinc-500">
          Já tens conta? <Link href={loginHref} className="text-[#6366F1] hover:underline">Entra</Link>
        </p>
      </form>
    </div>
  )
}
