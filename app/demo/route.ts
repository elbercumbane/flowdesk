import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { DEMO_COOKIE, demoCookieOptions } from '@/lib/demo'

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin
  const email = process.env.DEMO_EMAIL
  const password = process.env.DEMO_PASSWORD

  if (!email || !password) {
    const url = new URL('/login', origin)
    url.searchParams.set('error', 'The demo is not configured yet.')
    return NextResponse.redirect(url)
  }

  const redirectToApp = NextResponse.redirect(new URL('/app', origin))

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
            redirectToApp.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  await supabase.auth.signOut()

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    const url = new URL('/login', origin)
    url.searchParams.set('error', 'Could not open the sample organization.')
    return NextResponse.redirect(url)
  }

  redirectToApp.cookies.set(DEMO_COOKIE, '1', demoCookieOptions())
  return redirectToApp
}
