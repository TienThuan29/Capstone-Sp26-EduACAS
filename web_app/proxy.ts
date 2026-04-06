import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  void request;
  // Template: can't use localStorage here; use cookies/headers for firstLogin, etc.
  // Page-level protection currently lives in components (useEffect).
  // Enhance with secure cookies + validation before allowing /default vs /first-login.

  return NextResponse.next();
}

// Only run proxy on specific routes
export const config = {
  matcher: [
    "/first-login/:path*",
    "/default/:path*",
    "/test-auth-page/:path*",
    "/test-components-page/:path*",
  ],
};
