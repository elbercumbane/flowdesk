import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoiceDocument } from '@/lib/pdf/invoice-document'
import { NextResponse } from 'next/server'

function relName(rel: any, key: string) {
  if (!rel) return null
  const obj = Array.isArray(rel) ? rel[0] : rel
  return obj?.[key] ?? null
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*, customers(name, email), organizations(name), invoice_items(description, quantity, unit_price)')
    .eq('id', id)
    .single()

  if (error || !invoice) return new NextResponse('Not found', { status: 404 })

  const buffer = await renderToBuffer(
    InvoiceDocument({
      orgName: relName(invoice.organizations, 'name') ?? 'FlowDesk',
      number: invoice.number,
      status: invoice.status,
      issueDate: new Date(invoice.issue_date).toLocaleDateString('en-US'),
      dueDate: new Date(invoice.due_date).toLocaleDateString('en-US'),
      customerName: relName(invoice.customers, 'name') ?? '',
      customerEmail: relName(invoice.customers, 'email'),
      notes: invoice.notes,
      items: (invoice.invoice_items as any[]).map((it) => ({
        description: it.description,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unit_price),
      })),
    })
  )

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${invoice.number}.pdf"`,
    },
  })
}
