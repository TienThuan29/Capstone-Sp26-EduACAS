import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protected routes that require firstLogin = false
const protectedRoutes = [
  '/default',
  '/test-auth-page',
  '/test-components-page',
  // Add other regular pages here
]

// First login route that requires firstLogin = true
const firstLoginRoute = '/first-login'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Get user profile from localStorage (if available in cookies/request)
  // Note: In middleware, we can't directly access localStorage
  // We'll need to pass firstLogin status via cookie or header

  // For now, this middleware serves as a template.
  // The main protection is done in the page components via useEffect hooks

  // You can enhance this by:
  // 1. Storing firstLogin in a secure cookie after login
  // 2. Validating it in middleware before allowing access

  return NextResponse.next()
}

// Only run middleware on specific routes
export const config = {
  matcher: [
    '/first-login/:path*',
    '/default/:path*',
    '/test-auth-page/:path*',
    '/test-components-page/:path*',
  ],
}
