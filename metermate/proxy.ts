import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Route protection.
 *
 * This is a UX redirect layer only — every API route handler re-checks the
 * session and scopes its own queries by `userId`, since middleware can be
 * bypassed by calling an API route directly.
 */
const PUBLIC_PATHS = ["/login", "/signup"];

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const isAuthed = Boolean(request.auth);
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path);
  const isOnboardingPath = pathname === "/onboarding";

  if (!isAuthed) {
    if (isPublicPath) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublicPath) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const onboarded = request.auth?.user?.onboarded ?? false;
  if (!onboarded && !isOnboardingPath) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }
  if (onboarded && isOnboardingPath) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
});

export const config = {
  // Everything except static assets and the Auth.js/API handlers, which do
  // their own auth checks (and must stay reachable for login to work at all).
  // (Proxy always runs on the Node.js runtime in Next 16 — no Edge option —
  // so `lib/auth.ts` importing Prisma here is safe by construction.)
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
