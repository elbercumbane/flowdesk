import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { DEMO_COOKIE } from '@/lib/demo'

const destinations: Record<string, string> = {
  login: '/login',
  signup: '/signup',
  org: '/signup',
}

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin
  const to = request.nextUrl.searchParams.get('to') ?? 'login'
  const path = destinations[to] ?? '/login'
  const redirectTo = NextResponse.redirect(new URL(path, origin))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            redirectTo.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  await supabase.auth.signOut()
  redirectTo.cookies.set(DEMO_COOKIE, '', { path: '/', maxAge: 0 })
  return redirectTo
}
