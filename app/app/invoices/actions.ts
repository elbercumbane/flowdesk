'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type InvoiceItemInput = { description: string; quantity: number; unitPrice: number }

export async function createInvoiceWithItems(input: {
  customerId: string
  dealId: string
  number: string
  dueDate: string
  notes: string
  items: InvoiceItemInput[]
}) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('create_invoice_with_items', {
    p_customer_id: input.customerId,
    p_deal_id: input.dealId,
    p_number: input.number,
    p_due_date: input.dueDate,
    p_notes: input.notes,
    p_items: input.items,
  })

  if (error) return { error: error.message }
  revalidatePath('/app/invoices')
  return { error: null }
}

export async function updateInvoiceStatus(invoiceId: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('invoices')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', invoiceId)

  if (error) throw new Error(error.message)
  revalidatePath('/app/invoices')
}
