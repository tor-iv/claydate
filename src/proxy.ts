import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public paths that don't require a session cookie.
// /design is the component QA gallery — public in dev, login-only in production.
const PUBLIC_PATHS =
  process.env.NODE_ENV === "production" ? ["/login"] : ["/login", "/design"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
  ) {
    return NextResponse.next();
  }

  // Allow API upload endpoint (exact) and uploaded files (prefix)
  if (pathname === "/api/upload" || pathname.startsWith("/uploads/")) {
    return NextResponse.next();
  }

  // Allow the ICS feed for calendar app subscriptions (no session cookie available)
  if (pathname.startsWith("/api/feed/")) {
    return NextResponse.next();
  }

  // Check for session cookie (presence only — validation happens server-side)
  const hasSession = request.cookies.has("claydate-session");
  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    // Preserve the intended destination so login can return the user there
    const next = pathname + request.nextUrl.search;
    if (next !== "/") {
      loginUrl.searchParams.set("next", next);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except static/metadata files that must load without a
     * session: _next assets, and the app icons (favicon.ico, icon.svg, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|icon\\.svg|apple-icon\\.png).*)",
  ],
};
