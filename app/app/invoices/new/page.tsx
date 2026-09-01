import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { InvoiceForm } from './invoice-form'

export default async function NewInvoicePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: customers }, { data: deals }, { count }] = await Promise.all([
    supabase.from('customers').select('id, name').order('name'),
    supabase.from('deals').select('id, title').order('title'),
    supabase.from('invoices').select('*', { count: 'exact', head: true }),
  ])

  const suggestedNumber = `INV-${String((count ?? 0) + 1).padStart(4, '0')}`

  return (
    <div className="p-4 sm:p-6 max-w-2xl">
      <Link href="/app/invoices" className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 mb-4">
        <ArrowLeft className="h-4 w-4" />
        Voltar a Invoices
      </Link>

      <div className="rounded-xl border bg-white p-4 sm:p-6">
        <h1 className="text-lg font-semibold mb-4">Nova factura</h1>
        <InvoiceForm
          customers={customers ?? []}
          deals={deals ?? []}
          suggestedNumber={suggestedNumber}
        />
      </div>
    </div>
  )
}
