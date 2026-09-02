'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

/**
 * Lê um parâmetro `?toast=` da URL (usado por server actions que fazem redirect
 * após a mutação), mostra o toast e limpa o parâmetro sem recarregar a página.
 */
export function ToastFlash() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const message = searchParams.get('toast')
    if (!message) return

    toast.success(message)

    const params = new URLSearchParams(searchParams)
    params.delete('toast')
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [searchParams, pathname, router])

  return null
}
