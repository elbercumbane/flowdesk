import { login } from './actions'
import Link from 'next/link'
import { AuthBackground } from '@/components/auth-background'

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
    <AuthBackground>
      <div className="w-full max-w-sm space-y-4">
        <form action={login} className="fd-reveal space-y-4 rounded-xl border bg-white p-8 shadow-lg shadow-indigo-100/50">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#818CF8] to-[#6366F1] shadow-sm shadow-indigo-300/50" />
            <span className="text-sm font-semibold tracking-tight text-zinc-900">FlowDesk</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold">Entrar no FlowDesk</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Usa a tua conta, ou cria uma organização nova.
            </p>
          </div>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input id="email" name="email" type="email" required className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition" />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <input id="password" name="password" type="password" required className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition" />
          </div>

          <button type="submit" className="w-full rounded-md bg-[#6366F1] py-2 text-sm font-medium text-white hover:bg-[#4F46E5] active:scale-[0.97] transition hover:shadow-lg hover:shadow-indigo-500/25">
            Entrar
          </button>

          <p className="text-center text-sm text-zinc-500">
            Não tens conta?{' '}
            <Link href={signupHref} className="text-[#6366F1] hover:underline">
              Cria uma conta e a tua organização
            </Link>
          </p>
        </form>

        <div className="fd-reveal rounded-xl border border-dashed border-indigo-200 bg-white p-5 text-center [animation-delay:90ms]">
          <p className="text-sm font-medium text-zinc-800">Queres só ver um exemplo?</p>
          <p className="mt-1 text-sm text-zinc-500">
            Abre a organização de testes com 15 clientes e dados já preenchidos.
          </p>
          <Link
            href="/demo"
            className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-[#6366F1] px-3 py-2 text-sm font-medium text-[#4F46E5] hover:bg-[#EEF2FF]"
          >
            Ver organização de exemplo
          </Link>
        </div>
      </div>
    </AuthBackground>
  )
}
