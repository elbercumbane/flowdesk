import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createTask } from '../actions'

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: deals }, { data: customers }] = await Promise.all([
    supabase.from('deals').select('id, title').order('title'),
    supabase.from('customers').select('id, name').order('name'),
  ])

  return (
    <div className="p-4 sm:p-6 max-w-xl">
      <Link href="/app/tasks" className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back to Tasks
      </Link>

      <div className="fd-reveal rounded-xl border bg-white p-4 sm:p-6">
        <h1 className="text-lg font-semibold mb-4">New task</h1>

        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <form action={createTask} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="title" className="text-sm font-medium">Title *</label>
            <input id="title" name="title" required placeholder="e.g. Send proposal" className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="dealId" className="text-sm font-medium">Deal (optional)</label>
              <select id="dealId" name="dealId" className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition">
                <option value="">None</option>
                {deals?.map((d) => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="customerId" className="text-sm font-medium">Customer (optional)</label>
              <select id="customerId" name="customerId" className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition">
                <option value="">None</option>
                {customers?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="dueDate" className="text-sm font-medium">Due date (optional)</label>
            <input id="dueDate" name="dueDate" type="date" className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition" />
          </div>

          <button type="submit" className="w-full sm:w-auto rounded-md bg-[#6366F1] px-4 py-2 text-sm font-medium text-white hover:bg-[#4F46E5] active:scale-[0.97] transition hover:shadow-lg hover:shadow-indigo-500/25">
            Create task
          </button>
        </form>
      </div>
    </div>
  )
}
