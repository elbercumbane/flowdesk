import { createCustomer } from './actions'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { EMAIL_PATTERN, EMAIL_TITLE } from '@/lib/email'

export default async function NewCustomerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="p-4 sm:p-6 max-w-xl">
      <Link href="/app/customers" className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back to Customers
      </Link>

      <div className="fd-reveal rounded-xl border bg-white p-4 sm:p-6">
        <h1 className="text-lg font-semibold mb-4">New customer</h1>

        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <form action={createCustomer} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium">Name *</label>
            <input id="name" name="name" required className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="company" className="text-sm font-medium">Company</label>
              <input id="company" name="company" className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition" />
            </div>
            <div className="space-y-1">
              <label htmlFor="status" className="text-sm font-medium">Status</label>
              <select id="status" name="status" className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition">
                <option value="active">Active</option>
                <option value="lead">Lead</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input id="email" name="email" type="text" inputMode="email" autoComplete="email" pattern={EMAIL_PATTERN} title={EMAIL_TITLE} className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition" />
            </div>
            <div className="space-y-1">
              <label htmlFor="phone" className="text-sm font-medium">Phone</label>
              <input id="phone" name="phone" className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition" />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="notes" className="text-sm font-medium">Notes</label>
            <textarea id="notes" name="notes" rows={3} className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition" />
          </div>

          <button type="submit" className="w-full sm:w-auto rounded-md bg-[#6366F1] px-4 py-2 text-sm font-medium text-white hover:bg-[#4F46E5] active:scale-[0.97] transition hover:shadow-lg hover:shadow-indigo-500/25">
            Create customer
          </button>
        </form>
      </div>
    </div>
  )
}
