import { Suspense } from 'react'
import { Toaster } from 'sonner'
import { createClient } from '@/lib/supabase/server'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { PageTransition } from '@/components/page-transition'
import { ToastFlash } from '@/components/toast-flash'
import { DEMO_COOKIE } from '@/lib/demo'

export const dynamic = 'force-dynamic'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const headerStore = await headers()
  const { data: { user } } = await supabase.auth.getUser()
  const isDemoCookie = cookieStore.get(DEMO_COOKIE)?.value === '1'

  if (!user) {
    if (isDemoCookie) {
      const current = headerStore.get('x-flowdesk-pathname') || '/app'
      const next = current.startsWith('/app') ? current : '/app'
      redirect(`/demo?next=${encodeURIComponent(next)}`)
    }
    redirect('/login')
  }

  const isDemo = isDemoCookie || user.email === process.env.DEMO_EMAIL

  let orgName = 'Demo'
  if (isDemo) {
    const { data: membership } = await supabase
      .from('memberships')
      .select('organizations(name)')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    const org = membership?.organizations as { name?: string } | { name?: string }[] | null
    orgName = (Array.isArray(org) ? org[0]?.name : org?.name) || 'Demo'
  }

  return (
    <AppShell userEmail={user.email!} isDemo={isDemo} orgName={orgName}>
      <PageTransition>{children}</PageTransition>
      <Toaster position="bottom-right" richColors closeButton />
      <Suspense fallback={null}>
        <ToastFlash />
      </Suspense>
    </AppShell>
  )
}
