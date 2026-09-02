'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { updateInvoiceStatus } from './actions'

const statusStyles: Record<string, string> = {
  draft: 'bg-zinc-100 text-zinc-600',
  sent: 'bg-blue-50 text-blue-700',
  paid: 'bg-emerald-50 text-emerald-700',
  overdue: 'bg-red-50 text-red-700',
}

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
}

export function InvoiceStatusSelect({
  invoiceId,
  currentStatus,
}: {
  invoiceId: string
  currentStatus: string
}) {
  const [, startTransition] = useTransition()

  return (
    <select
      defaultValue={currentStatus}
      onChange={(e) => {
        const next = e.target.value
        startTransition(() => updateInvoiceStatus(invoiceId, next))
        toast.success(`Factura marcada como ${statusLabels[next] ?? next}`)
      }}
      className={`rounded-full px-2.5 py-1 text-xs font-medium border-0 ${statusStyles[currentStatus]}`}
    >
      <option value="draft">Draft</option>
      <option value="sent">Sent</option>
      <option value="paid">Paid</option>
      <option value="overdue">Overdue</option>
    </select>
  )
}
