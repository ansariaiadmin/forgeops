import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * Route protection + root redirect:
 * - `/` → `/dashboard`
 * - Everything except /auth/* requires a session → redirect to /auth/login
 * - Authenticated users visiting /auth/* are sent to /dashboard
 * - /api/* is handled by the route handlers themselves (proper 401s)
 *
 * Only `next-auth/jwt` is imported here so this stays Edge-runtime safe.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Root goes straight to the dashboard.
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  const token = await getToken({ req: request })
  const isAuthPage = pathname.startsWith('/auth/')

  // Logged-in users should not see the auth pages.
  if (isAuthPage) {
    if (token) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      url.search = ''
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // Everything else is protected.
  if (!token) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|woff2?)$).*)',
  ],
}
