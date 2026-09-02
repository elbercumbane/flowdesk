'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Deal, customerName, formatMoney } from './deals-view'
import { updateDealStage } from './actions'

const stages = [
  { key: 'lead', label: 'Lead' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'proposal', label: 'Proposal' },
  { key: 'won', label: 'Won' },
  { key: 'lost', label: 'Lost' },
]

export function DealsKanban({
  deals,
  setDeals,
}: {
  deals: Deal[]
  setDeals: (d: Deal[]) => void
}) {
  const [, startTransition] = useTransition()

  function moveDeal(dealId: string, newStage: string) {
    const current = deals.find((d) => d.id === dealId)
    if (current && current.stage === newStage) return
    setDeals(deals.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d)))
    const stageLabel = stages.find((s) => s.key === newStage)?.label ?? newStage
    startTransition(() => {
      updateDealStage(dealId, newStage)
    })
    toast.success(`Deal movido para ${stageLabel}`)
  }

  return (
    <div className="fd-reveal flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
      {stages.map((stage) => {
        const stageDeals = deals.filter((d) => d.stage === stage.key)
        return (
          <div
            key={stage.key}
            className="flex flex-col shrink-0 w-64 sm:w-72"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const dealId = e.dataTransfer.getData('dealId')
              if (dealId) moveDeal(dealId, stage.key)
            }}
          >
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-sm font-medium text-zinc-700">{stage.label}</span>
              <span className="min-w-5 rounded-full bg-zinc-100 px-1.5 text-center text-xs font-medium text-zinc-500">
                {stageDeals.length}
              </span>
            </div>

            <div className="fd-stagger flex flex-col gap-2 min-h-[80px] rounded-lg bg-zinc-100/60 p-2 transition-colors">
              {stageDeals.map((d) => (
                <div
                  key={d.id}
                  data-deal-id={d.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('dealId', d.id)}
                  className="rounded-lg border bg-white p-3 cursor-grab will-change-transform transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200 active:cursor-grabbing active:scale-[1.03] active:shadow-lg active:rotate-1"
                >
                  <p className="text-sm font-medium text-zinc-900">{d.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{customerName(d.customers)}</p>
                  <p className="text-sm font-medium text-zinc-700 mt-1.5">{formatMoney(d.value)}</p>

                  <select
                    value={d.stage}
                    onChange={(e) => moveDeal(d.id, e.target.value)}
                    className="mt-2 w-full rounded-md border px-2 py-1 text-xs text-zinc-600 bg-zinc-50"
                  >
                    {stages.map((s) => (
                      <option key={s.key} value={s.key}>
                        Mover para {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
