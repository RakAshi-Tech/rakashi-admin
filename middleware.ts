import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/dashboard', '/drivers', '/deliveries', '/penalties', '/reports', '/settings']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('admin_token')

  // Root is the login page: redirect to dashboard if already logged in
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // Protect admin routes
  const isProtected = PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
