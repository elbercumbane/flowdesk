import Link from 'next/link'
import { Deal, customerName, formatMoney } from './deals-view'

const stageStyles: Record<string, string> = {
  lead: 'bg-zinc-100 text-zinc-600',
  qualified: 'bg-blue-50 text-blue-700',
  proposal: 'bg-amber-50 text-amber-700',
  won: 'bg-emerald-50 text-emerald-700',
  lost: 'bg-red-50 text-red-700',
}

export function DealsTable({ deals }: { deals: Deal[] }) {
  return (
    <>
      <div className="hidden md:block rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-zinc-50 text-left text-xs text-zinc-500">
              <th className="px-4 py-3 font-medium">Deal</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Estágio</th>
            </tr>
          </thead>
          <tbody className="fd-stagger">
            {deals.map((d) => (
              <tr key={d.id} className="border-b last:border-0 hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-3 font-medium text-zinc-900">{d.title}</td>
                <td className="px-4 py-3 text-zinc-500">{customerName(d.customers)}</td>
                <td className="px-4 py-3 text-zinc-700">{formatMoney(d.value)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${stageStyles[d.stage]}`}>
                    {d.stage}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="fd-stagger md:hidden flex flex-col gap-2">
        {deals.map((d) => (
          <div key={d.id} className="rounded-xl border bg-white p-4 flex flex-col gap-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200">
            <div className="flex items-center justify-between">
              <span className="font-medium text-zinc-900">{d.title}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${stageStyles[d.stage]}`}>
                {d.stage}
              </span>
            </div>
            <span className="text-sm text-zinc-500">{customerName(d.customers)}</span>
            <span className="text-sm text-zinc-700 font-medium">{formatMoney(d.value)}</span>
          </div>
        ))}
      </div>
    </>
  )
}
