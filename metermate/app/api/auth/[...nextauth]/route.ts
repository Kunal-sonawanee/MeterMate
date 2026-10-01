import { NextResponse, type NextRequest } from "next/server";
import { handlers } from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const { GET } = handlers;

const LOGIN_LIMIT = { limit: 10, windowMs: 15 * 60_000 };

/**
 * Only the credentials callback (the actual "try this password" step) is
 * rate-limited — signout, CSRF-token and session-update POSTs under this
 * same catch-all route aren't login attempts and shouldn't be throttled.
 */
export async function POST(request: NextRequest) {
  if (request.url.includes("/api/auth/callback/credentials")) {
    const { ok, retryAfterSeconds } = rateLimit(`login:${clientKey(request)}`, LOGIN_LIMIT);
    if (!ok) {
      return NextResponse.json(
        { message: `Too many attempts. Try again in ${retryAfterSeconds}s.` },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
      );
    }
  }

  return handlers.POST(request);
}
