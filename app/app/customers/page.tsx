import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Users } from 'lucide-react'

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  lead: 'bg-amber-50 text-amber-700',
  inactive: 'bg-zinc-100 text-zinc-500',
}

export default async function CustomersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, name, company, email, phone, status')
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="p-6 text-sm text-red-600">Failed to load customers: {error.message}</div>
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl font-semibold text-zinc-900">Customers</h1>
        <Link
          href="/app/customers/new"
          className="flex items-center gap-1.5 rounded-md bg-[#6366F1] px-3 py-2 text-sm font-medium text-white hover:bg-[#4F46E5] active:scale-[0.97] transition hover:shadow-lg hover:shadow-indigo-500/25"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Customer</span>
        </Link>
      </div>

      {!customers || customers.length === 0 ? (
        <div className="fd-reveal rounded-xl border border-dashed bg-white p-10 text-center">
          <span className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-50 animate-bob">
            <Users className="h-8 w-8 text-zinc-300" />
          </span>
          <p className="text-sm text-zinc-500">You don&apos;t have any customers yet.</p>
          <Link href="/app/customers/new" className="mt-2 inline-block text-sm text-[#6366F1] hover:underline">
            Create your first customer
          </Link>
        </div>
      ) : (
        <>
          {/* Tabela — desktop/tablet (md e acima) */}
          <div className="hidden md:block rounded-xl border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-zinc-50 text-left text-xs text-zinc-500">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="fd-stagger">
                {customers.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/app/customers/${c.id}`} className="font-medium text-zinc-900 hover:text-[#6366F1]">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{c.company || '—'}</td>
                    <td className="px-4 py-3 text-zinc-500">{c.email || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[c.status] ?? statusStyles.active}`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards — mobile (abaixo de md) */}
          <div className="fd-stagger md:hidden flex flex-col gap-2">
            {customers.map((c) => (
              <Link
                key={c.id}
                href={`/app/customers/${c.id}`}
                className="rounded-xl border bg-white p-4 flex flex-col gap-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-zinc-900">{c.name}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[c.status] ?? statusStyles.active}`}>
                    {c.status}
                  </span>
                </div>
                {c.company && <span className="text-sm text-zinc-500">{c.company}</span>}
                {c.email && <span className="text-sm text-zinc-500">{c.email}</span>}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
