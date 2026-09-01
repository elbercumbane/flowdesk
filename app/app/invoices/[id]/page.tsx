import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'
import { InvoiceStatusSelect } from '../invoice-status-select'

function relName(rel: any, key: string) {
  if (!rel) return null
  const obj = Array.isArray(rel) ? rel[0] : rel
  return obj?.[key] ?? null
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*, customers(name, email, company), deals(title), invoice_items(id, description, quantity, unit_price)')
    .eq('id', id)
    .single()

  if (error || !invoice) notFound()

  const items = invoice.invoice_items as any[]
  const total = items.reduce((sum, it) => sum + Number(it.quantity) * Number(it.unit_price), 0)

  return (
    <div className="p-4 sm:p-6 max-w-2xl">
      <Link href="/app/invoices" className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 mb-4">
        <ArrowLeft className="h-4 w-4" />
        Voltar a Invoices
      </Link>

      <div className="rounded-xl border bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">{invoice.number}</h1>
            <p className="text-sm text-zinc-500">{relName(invoice.customers, 'name')}</p>
            {invoice.deals && (
              <p className="text-xs text-zinc-400 mt-0.5">Deal: {relName(invoice.deals, 'title')}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <InvoiceStatusSelect invoiceId={invoice.id} currentStatus={invoice.status} />
            <a
              href={`/api/invoices/${invoice.id}/pdf`}
              target="_blank"
              className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">PDF</span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t pt-4 mb-4 text-sm">
          <div>
            <p className="text-xs text-zinc-400">Data de emissão</p>
            <p className="text-zinc-700">{new Date(invoice.issue_date).toLocaleDateString('pt-PT')}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Vencimento</p>
            <p className="text-zinc-700">{new Date(invoice.due_date).toLocaleDateString('pt-PT')}</p>
          </div>
        </div>

        {/* Itens — desktop */}
        <div className="hidden sm:block border-t pt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-zinc-500">
                <th className="pb-2 font-medium">Descrição</th>
                <th className="pb-2 font-medium">Qtd</th>
                <th className="pb-2 font-medium">Preço</th>
                <th className="pb-2 font-medium text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-t">
                  <td className="py-2 text-zinc-900">{it.description}</td>
                  <td className="py-2 text-zinc-500">{Number(it.quantity)}</td>
                  <td className="py-2 text-zinc-500">${Number(it.unit_price).toFixed(2)}</td>
                  <td className="py-2 text-right text-zinc-700">
                    ${(Number(it.quantity) * Number(it.unit_price)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Itens — mobile */}
        <div className="sm:hidden border-t pt-4 flex flex-col gap-2">
          {items.map((it) => (
            <div key={it.id} className="flex items-center justify-between text-sm">
              <div>
                <p className="text-zinc-900">{it.description}</p>
                <p className="text-xs text-zinc-400">{Number(it.quantity)} × ${Number(it.unit_price).toFixed(2)}</p>
              </div>
              <span className="text-zinc-700 font-medium">
                ${(Number(it.quantity) * Number(it.unit_price)).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-end border-t pt-3 mt-3">
          <span className="text-sm text-zinc-500 mr-2">Total:</span>
          <span className="text-lg font-semibold text-zinc-900">${total.toFixed(2)}</span>
        </div>

        {invoice.notes && (
          <div className="border-t pt-4 mt-4">
            <p className="text-xs font-medium text-zinc-500 mb-1">Notas</p>
            <p className="text-sm text-zinc-700 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
