'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DEMO_COOKIE } from '@/lib/demo'

function safeReturnTo(value: FormDataEntryValue | null) {
  const path = typeof value === 'string' ? value : ''
  if (path.startsWith('/invite/')) return path
  return '/app'
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const returnTo = safeReturnTo(formData.get('returnTo'))

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const q = new URLSearchParams({ error: error.message })
    if (returnTo !== '/app') q.set('returnTo', returnTo)
    redirect(`/login?${q.toString()}`)
  }

  const cookieStore = await cookies()
  cookieStore.delete(DEMO_COOKIE)
  revalidatePath('/', 'layout')
  redirect(returnTo)
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const returnTo = safeReturnTo(formData.get('returnTo'))

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })

  if (error) {
    const q = new URLSearchParams({ error: error.message })
    if (returnTo !== '/app') q.set('returnTo', returnTo)
    redirect(`/signup?${q.toString()}`)
  }

  const cookieStore = await cookies()
  cookieStore.delete(DEMO_COOKIE)
  revalidatePath('/', 'layout')
  redirect(returnTo === '/app' ? '/onboarding' : returnTo)
}
