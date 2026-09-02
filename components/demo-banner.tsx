import Link from 'next/link'

export function DemoBanner({ orgName }: { orgName: string }) {
  return (
    <div className="fd-reveal border-b border-indigo-200 bg-[#EEF2FF] px-4 py-3 sm:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#312E81]">
            Organização de exemplo — {orgName}
          </p>
          <p className="text-sm text-[#4338CA]">
            Estás a ver o catálogo com dados seed (clientes, deals, tarefas e facturas). Isto não é a tua conta.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/demo/exit?to=login"
            className="inline-flex items-center justify-center rounded-md border border-[#6366F1] bg-white px-3 py-1.5 text-sm font-medium text-[#4F46E5] hover:bg-indigo-50"
          >
            Entrar na tua conta
          </Link>
          <Link
            href="/demo/exit?to=signup"
            className="inline-flex items-center justify-center rounded-md bg-[#6366F1] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#4F46E5] active:scale-[0.97] transition hover:shadow-lg hover:shadow-indigo-500/25"
          >
            Criar conta nova
          </Link>
          <Link
            href="/demo/exit?to=org"
            className="inline-flex items-center justify-center rounded-md bg-[#312E81] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#1E1B4B]"
          >
            Criar a tua organização
          </Link>
        </div>
      </div>
    </div>
  )
}
