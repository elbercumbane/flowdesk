'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { createInvoiceWithItems } from '../actions'

type Item = { description: string; quantity: number; unitPrice: number }

export function InvoiceForm({
  customers,
  deals,
  suggestedNumber,
}: {
  customers: { id: string; name: string }[]
  deals: { id: string; title: string }[]
  suggestedNumber: string
}) {
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([{ description: '', quantity: 1, unitPrice: 0 }])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)

  function updateItem(index: number, field: keyof Item, value: string) {
    setItems((prev) =>
      prev.map((it, i) =>
        i === index
          ? { ...it, [field]: field === 'description' ? value : parseFloat(value) || 0 }
          : it
      )
    )
  }

  function addItem() {
    setItems((prev) => [...prev, { description: '', quantity: 1, unitPrice: 0 }])
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(formData: FormData) {
    setError(null)
    if (items.length === 0 || items.some((i) => !i.description.trim())) {
      setError('Each line needs a description.')
      return
    }

    setSubmitting(true)
    const result = await createInvoiceWithItems({
      customerId: formData.get('customerId') as string,
      dealId: (formData.get('dealId') as string) || '',
      number: formData.get('number') as string,
      dueDate: formData.get('dueDate') as string,
      notes: (formData.get('notes') as string) || '',
      items,
    })
    setSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }
    toast.success('Invoice created')
    router.push('/app/invoices')
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

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
          <label htmlFor="dealId" className="text-sm font-medium">Deal (optional)</label>
          <select id="dealId" name="dealId" className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition">
            <option value="">None</option>
            {deals.map((d) => (
              <option key={d.id} value={d.id}>{d.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="number" className="text-sm font-medium">Number *</label>
          <input id="number" name="number" required defaultValue={suggestedNumber} className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition" />
        </div>
        <div className="space-y-1">
          <label htmlFor="dueDate" className="text-sm font-medium">Due date *</label>
          <input id="dueDate" name="dueDate" type="date" required className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition" />
        </div>
      </div>

      {/* Linhas de itens */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Line items *</label>

        {/* Cabeçalho — só desktop */}
        <div className="hidden sm:grid grid-cols-[1fr_80px_100px_100px_32px] gap-2 px-1 text-xs text-zinc-500">
          <span>Description</span>
          <span>Qty</span>
          <span>Price</span>
          <span>Subtotal</span>
          <span></span>
        </div>

        {items.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-2 sm:grid-cols-[1fr_80px_100px_100px_32px] gap-2 rounded-lg border p-2 sm:border-0 sm:p-0"
          >
            <input
              placeholder="Description"
              value={item.description}
              onChange={(e) => updateItem(index, 'description', e.target.value)}
              className="col-span-2 sm:col-span-1 rounded-md border px-2 py-1.5 text-sm"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={item.quantity}
              onChange={(e) => updateItem(index, 'quantity', e.target.value)}
              className="rounded-md border px-2 py-1.5 text-sm"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={item.unitPrice}
              onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
              className="rounded-md border px-2 py-1.5 text-sm"
            />
            <div className="flex items-center text-sm text-zinc-600 px-1">
              ${(item.quantity * item.unitPrice).toFixed(2)}
            </div>
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="flex items-center justify-center text-zinc-300 hover:text-red-600"
              aria-label="Remove line"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 text-sm text-[#6366F1] hover:underline"
        >
          <Plus className="h-4 w-4" />
          Add line
        </button>
      </div>

      <div className="flex justify-end border-t pt-3">
        <span className="text-sm text-zinc-500 mr-2">Total:</span>
        <span className="text-lg font-semibold text-zinc-900">${total.toFixed(2)}</span>
      </div>

      <div className="space-y-1">
        <label htmlFor="notes" className="text-sm font-medium">Notes</label>
        <textarea id="notes" name="notes" rows={2} className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition" />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full sm:w-auto rounded-md bg-[#6366F1] px-4 py-2 text-sm font-medium text-white hover:bg-[#4F46E5] active:scale-[0.97] transition hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50"
      >
        {submitting ? 'Creating…' : 'Create invoice'}
      </button>
    </form>
  )
}
