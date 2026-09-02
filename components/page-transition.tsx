'use client'

import { usePathname } from 'next/navigation'

/**
 * Reproduz a animação de entrada (`fd-reveal`) sempre que a rota muda,
 * remontando o conteúdo com uma `key` derivada do pathname.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div key={pathname} className="fd-page">
      {children}
    </div>
  )
}
