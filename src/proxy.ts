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
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
