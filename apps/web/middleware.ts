import { NextResponse, type NextRequest } from "next/server";

const ACCESS_COOKIE = "sb_access";

/**
 * Fast edge guard for the authenticated app: redirects to /login when no access
 * cookie is present. This is a cheap presence check — the API still verifies the
 * JWT on every request, and the dashboard re-checks via /auth/me on load.
 */
export function middleware(request: NextRequest): NextResponse {
  const hasSession = request.cookies.has(ACCESS_COOKIE);
  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding"],
};
