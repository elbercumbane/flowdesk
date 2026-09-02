import { createOrganization } from './actions'
import { AuthBackground } from '@/components/auth-background'

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <AuthBackground>
      <form action={createOrganization} className="fd-reveal w-full max-w-sm space-y-4 rounded-xl border bg-white p-8 shadow-lg shadow-indigo-100/50">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#818CF8] to-[#6366F1] shadow-sm shadow-indigo-300/50" />
          <span className="text-sm font-semibold tracking-tight text-zinc-900">FlowDesk</span>
        </div>
        <h1 className="text-xl font-semibold">Cria a tua organização</h1>
        <p className="text-sm text-zinc-500">É o espaço onde vais gerir clientes, deals e facturas.</p>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <div className="space-y-1">
          <label htmlFor="orgName" className="text-sm font-medium">Nome da organização</label>
          <input id="orgName" name="orgName" type="text" required placeholder="Ex: Acme Corp" className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition" />
        </div>

        <button type="submit" className="w-full rounded-md bg-[#6366F1] py-2 text-sm font-medium text-white hover:bg-[#4F46E5] active:scale-[0.97] transition hover:shadow-lg hover:shadow-indigo-500/25">
          Criar organização
        </button>
      </form>
    </AuthBackground>
  )
}
