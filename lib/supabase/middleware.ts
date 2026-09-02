import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { DEMO_COOKIE, demoCookieOptions } from '@/lib/demo'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, { ...options, path: '/' })
          )
        },
      },
    }
  )

  let {
    data: { user },
  } = await supabase.auth.getUser()

  const onApp = request.nextUrl.pathname.startsWith('/app')
  const isDemo = request.cookies.get(DEMO_COOKIE)?.value === '1'

  if (!user && onApp && isDemo) {
    const email = process.env.DEMO_EMAIL
    const password = process.env.DEMO_PASSWORD
    if (email && password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (!error && data.user) {
        user = data.user
      }
    }
  }

  if (!user && onApp) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    const redirectRes = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie.name, cookie.value)
    })
    if (isDemo) {
      redirectRes.cookies.set(DEMO_COOKIE, '', { ...demoCookieOptions(), maxAge: 0 })
    }
    return redirectRes
  }

  return supabaseResponse
}
