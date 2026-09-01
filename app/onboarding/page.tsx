import { createOrganization } from './actions'

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
      <form action={createOrganization} className="w-full max-w-sm space-y-4 rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold">Cria a tua organização</h1>
        <p className="text-sm text-zinc-500">É o espaço onde vais gerir clientes, deals e facturas.</p>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <div className="space-y-1">
          <label htmlFor="orgName" className="text-sm font-medium">Nome da organização</label>
          <input id="orgName" name="orgName" type="text" required placeholder="Ex: Acme Corp" className="w-full rounded-md border px-3 py-2 text-sm" />
        </div>

        <button type="submit" className="w-full rounded-md bg-[#6366F1] py-2 text-sm font-medium text-white hover:bg-[#4F46E5]">
          Criar organização
        </button>
      </form>
    </div>
  )
}
