import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createDeal } from '../actions'

export default async function NewDealPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: customers } = await supabase
    .from('customers')
    .select('id, name')
    .order('name')

  return (
    <div className="p-4 sm:p-6 max-w-xl">
      <Link href="/app/deals" className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back to Deals
      </Link>

      <div className="fd-reveal rounded-xl border bg-white p-4 sm:p-6">
        <h1 className="text-lg font-semibold mb-4">New deal</h1>

        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        {!customers || customers.length === 0 ? (
          <p className="text-sm text-zinc-500">
            You need at least one customer before you can create a deal.{' '}
            <Link href="/app/customers/new" className="text-[#6366F1] hover:underline">
              Create customer
            </Link>
          </p>
        ) : (
          <form action={createDeal} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="title" className="text-sm font-medium">Title *</label>
              <input id="title" name="title" required placeholder="Ex: Website revamp" className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="customerId" className="text-sm font-medium">Customer *</label>
                <select id="customerId" name="customerId" required className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition">
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="value" className="text-sm font-medium">Value (USD)</label>
                <input id="value" name="value" type="number" min="0" step="0.01" placeholder="0.00" className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition" />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="stage" className="text-sm font-medium">Initial stage</label>
              <select id="stage" name="stage" defaultValue="lead" className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition">
                <option value="lead">Lead</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="notes" className="text-sm font-medium">Notes</label>
              <textarea id="notes" name="notes" rows={3} className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition" />
            </div>

            <button type="submit" className="w-full sm:w-auto rounded-md bg-[#6366F1] px-4 py-2 text-sm font-medium text-white hover:bg-[#4F46E5] active:scale-[0.97] transition hover:shadow-lg hover:shadow-indigo-500/25">
              Create deal
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
