'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteCustomer } from './actions'

export function DeleteCustomerButton({ customerId }: { customerId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="flex items-center gap-1.5 text-sm text-red-600 hover:underline"
      >
        <Trash2 className="h-4 w-4" />
        Delete customer
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-zinc-600">Are you sure?</span>
      <button
        onClick={() => setConfirming(false)}
        className="text-sm text-zinc-500 hover:text-zinc-900"
      >
        Cancel
      </button>
      <button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await deleteCustomer(customerId)
            router.push('/app/customers')
          })
        }
        className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        {isPending ? 'Deleting…' : 'Confirm'}
      </button>
    </div>
  )
}
