'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AcceptInviteButton({ token }: { token: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function accept() {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.rpc('accept_invitation', { p_token: token })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }
    router.push('/app')
  }

  return (
    <div>
      {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <button
        onClick={accept}
        disabled={loading}
        className="w-full rounded-md bg-[#6366F1] py-2 text-sm font-medium text-white hover:bg-[#4F46E5] disabled:opacity-50"
      >
        {loading ? 'A aceitar…' : 'Aceitar convite'}
      </button>
    </div>
  )
}
