import { login } from './actions'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; returnTo?: string }>
}) {
  const { error, returnTo } = await searchParams
  const signupHref = returnTo
    ? `/signup?returnTo=${encodeURIComponent(returnTo)}`
    : '/signup'

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
      <form action={login} className="w-full max-w-sm space-y-4 rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold">Entrar no FlowDesk</h1>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input id="email" name="email" type="email" required className="w-full rounded-md border px-3 py-2 text-sm" />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input id="password" name="password" type="password" required className="w-full rounded-md border px-3 py-2 text-sm" />
        </div>

        <button type="submit" className="w-full rounded-md bg-[#6366F1] py-2 text-sm font-medium text-white hover:bg-[#4F46E5]">
          Entrar
        </button>

        <p className="text-center text-sm text-zinc-500">
          Não tens conta? <Link href={signupHref} className="text-[#6366F1] hover:underline">Cria uma</Link>
        </p>
      </form>
    </div>
  )
}
