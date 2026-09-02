import { Check } from 'lucide-react'
import { DecorBackground } from './decor-background'

const highlights = [
  'Customers, deals & invoices in one workspace',
  'Kanban pipeline that updates the moment you drag',
  'Activity log so nothing slips through',
]

/**
 * Layout de autenticação em duas colunas: painel de marca animado à esquerda
 * (lg+) e o card à direita, deslocado do centro. Em ecrãs pequenos fica só o
 * card sobre o fundo decorativo suave.
 */
export function AuthBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen">
      {/* Painel de marca — só lg+ */}
      <aside className="relative hidden w-[46%] shrink-0 flex-col justify-between overflow-hidden p-12 text-white lg:flex xl:w-[42%]">
        <DecorBackground tone="brand" className="absolute inset-0" />

        <div className="relative z-10 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-white/15 ring-1 ring-white/25 backdrop-blur-sm" />
          <span className="text-base font-semibold tracking-tight">FlowDesk</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            Everything your team needs to close deals.
          </h2>
          <ul className="mt-7 space-y-3.5">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-white/80">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
                  <Check className="h-3 w-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-white/45">Built for teams that ship every day.</p>
      </aside>

      {/* Lado do formulário */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-10 lg:justify-start lg:px-16 xl:px-24">
        <DecorBackground tone="light" className="absolute inset-0" />
        <div className="relative z-10 w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
