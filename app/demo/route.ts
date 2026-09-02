import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'
import { DEMO_COOKIE, demoCookieOptions } from '@/lib/demo'

function safeAppPath(value: string | null) {
  if (!value) return '/app'
  if (!value.startsWith('/app')) return '/app'
  if (value.startsWith('/demo')) return '/app'
  return value
}

export async function GET(request: NextRequest) {
  const email = process.env.DEMO_EMAIL
  const password = process.env.DEMO_PASSWORD
  const next = safeAppPath(request.nextUrl.searchParams.get('next'))

  if (!email || !password) {
    redirect('/login?error=' + encodeURIComponent('The demo is not configured yet.'))
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, { ...options, path: '/' })
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      redirect('/login?error=' + encodeURIComponent('Could not open the sample organization.'))
    }
  }

  cookieStore.set(DEMO_COOKIE, '1', demoCookieOptions())
  redirect(next)
}
