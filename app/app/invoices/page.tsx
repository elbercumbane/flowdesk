import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
import { InvoiceStatusSelect } from './invoice-status-select'

const statusStyles: Record<string, string> = {
  draft: 'bg-zinc-100 text-zinc-600',
  sent: 'bg-blue-50 text-blue-700',
  paid: 'bg-emerald-50 text-emerald-700',
  overdue: 'bg-red-50 text-red-700',
}

function relName(rel: any, key: string) {
  if (!rel) return null
  const obj = Array.isArray(rel) ? rel[0] : rel
  return obj?.[key] ?? null
}

export default async function InvoicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('id, number, status, due_date, customers(name), deals(title), invoice_items(quantity, unit_price)')
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="p-6 text-sm text-red-600">Erro a carregar invoices: {error.message}</div>
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl font-semibold text-zinc-900">Invoices</h1>
        <Link
          href="/app/invoices/new"
          className="flex items-center gap-1.5 rounded-md bg-[#6366F1] px-3 py-2 text-sm font-medium text-white hover:bg-[#4F46E5] active:scale-[0.97] transition hover:shadow-lg hover:shadow-indigo-500/25"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Invoice</span>
        </Link>
      </div>

      {!invoices || invoices.length === 0 ? (
        <div className="fd-reveal rounded-xl border border-dashed bg-white p-10 text-center">
          <span className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-50 animate-bob">
            <FileText className="h-8 w-8 text-zinc-300" />
          </span>
          <p className="text-sm text-zinc-500">Ainda não tens nenhuma factura.</p>
          <Link href="/app/invoices/new" className="mt-2 inline-block text-sm text-[#6366F1] hover:underline">
            Criar a primeira factura
          </Link>
        </div>
      ) : (
        <>
          {/* Tabela — desktop */}
          <div className="hidden md:block rounded-xl border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-zinc-50 text-left text-xs text-zinc-500">
                  <th className="px-4 py-3 font-medium">Número</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Vencimento</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="fd-stagger">
                {invoices.map((inv) => {
                  const total = (inv.invoice_items as any[]).reduce(
                    (sum, it) => sum + Number(it.quantity) * Number(it.unit_price),
                    0
                  )
                  return (
                    <tr key={inv.id} className="border-b last:border-0 hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/app/invoices/${inv.id}`} className="font-medium text-zinc-900 hover:text-[#6366F1]">
                          {inv.number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">{relName(inv.customers, 'name')}</td>
                      <td className="px-4 py-3 text-zinc-500">
                        {new Date(inv.due_date).toLocaleDateString('pt-PT')}
                      </td>
                      <td className="px-4 py-3 text-zinc-700 font-medium">${total.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <InvoiceStatusSelect invoiceId={inv.id} currentStatus={inv.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/app/invoices/${inv.id}`} className="text-xs text-[#6366F1] hover:underline">
                          Ver
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Cards — mobile */}
          <div className="fd-stagger md:hidden flex flex-col gap-2">
            {invoices.map((inv) => {
              const total = (inv.invoice_items as any[]).reduce(
                (sum, it) => sum + Number(it.quantity) * Number(it.unit_price),
                0
              )
              return (
                <Link
                  key={inv.id}
                  href={`/app/invoices/${inv.id}`}
                  className="rounded-xl border bg-white p-4 flex flex-col gap-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-zinc-900">{inv.number}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[inv.status]}`}>
                      {inv.status}
                    </span>
                  </div>
                  <span className="text-sm text-zinc-500">{relName(inv.customers, 'name')}</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-zinc-400">
                      Vence {new Date(inv.due_date).toLocaleDateString('pt-PT')}
                    </span>
                    <span className="text-sm font-semibold text-zinc-900">${total.toFixed(2)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
