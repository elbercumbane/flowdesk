import { NextResponse, type NextRequest } from 'next/server'
import { DEMO_COOKIE } from '@/lib/demo'

function hasAuthCookie(request: NextRequest) {
  return request.cookies.getAll().some((cookie) => cookie.name.includes('-auth-token'))
}

/**
 * Only an optimistic cookie check. Do not call Supabase getUser() here:
 * proxy is the wrong place for full session management, and a failed
 * getUser() was sending demo users to /login on every sidebar click.
 */
export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const onApp = pathname.startsWith('/app')
  const isDemo = request.cookies.get(DEMO_COOKIE)?.value === '1'
  const signedIn = hasAuthCookie(request)

  if (onApp && !isDemo && !signedIn) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    const redirectTo = NextResponse.redirect(url, 303)
    redirectTo.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    return redirectTo
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-flowdesk-pathname', pathname)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })
  response.headers.set('Cache-Control', 'no-store')
  return response
}
