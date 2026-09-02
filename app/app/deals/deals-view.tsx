'use client'

import { useState } from 'react'
import { LayoutGrid, List, Plus, Briefcase } from 'lucide-react'
import Link from 'next/link'
import { DealsTable } from './deals-table'
import { DealsKanban } from './deals-kanban'

export type Deal = {
  id: string
  title: string
  value: number
  stage: string
  customer_id: string
  customers: { name: string } | { name: string }[] | null
}

export function DealsView({ initialDeals }: { initialDeals: Deal[] }) {
  const [view, setView] = useState<'table' | 'kanban'>('kanban')
  const [deals, setDeals] = useState(initialDeals)

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3">
        <h1 className="text-lg sm:text-xl font-semibold text-zinc-900">Deals</h1>

        <div className="flex items-center gap-2">
          <div className="flex rounded-md border bg-white p-0.5">
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm transition-colors active:scale-95 ${
                view === 'kanban' ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'text-zinc-500 hover:text-zinc-800'
              }`}
              aria-label="Vista kanban"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setView('table')}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm transition-colors active:scale-95 ${
                view === 'table' ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'text-zinc-500 hover:text-zinc-800'
              }`}
              aria-label="Vista tabela"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Tabela</span>
            </button>
          </div>

          <Link
            href="/app/deals/new"
            className="flex items-center gap-1.5 rounded-md bg-[#6366F1] px-3 py-2 text-sm font-medium text-white hover:bg-[#4F46E5] active:scale-[0.97] transition hover:shadow-lg hover:shadow-indigo-500/25"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Deal</span>
          </Link>
        </div>
      </div>

      {deals.length === 0 ? (
        <div className="fd-reveal rounded-xl border border-dashed bg-white p-10 text-center">
          <span className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-50 animate-bob">
            <Briefcase className="h-8 w-8 text-zinc-300" />
          </span>
          <p className="text-sm text-zinc-500">Ainda não tens nenhum deal registado.</p>
          <Link href="/app/deals/new" className="mt-2 inline-block text-sm text-[#6366F1] hover:underline">
            Criar o primeiro deal
          </Link>
        </div>
      ) : view === 'kanban' ? (
        <DealsKanban deals={deals} setDeals={setDeals} />
      ) : (
        <DealsTable deals={deals} />
      )}
    </div>
  )
}

export function customerName(c: Deal['customers']) {
  if (!c) return '—'
  return Array.isArray(c) ? c[0]?.name ?? '—' : c.name
}

export function formatMoney(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
}
