/**
 * Fixed-window rate limiting, in memory.
 *
 * Deliberately simple: this holds state in the process, so it resets on
 * restart and doesn't share state across instances. That's the right amount
 * of protection for a single-instance deployment, and it's better than
 * nothing while running serverless/multi-instance — but at real scale this
 * should be swapped for a shared store (e.g. Upstash Redis's rate-limit
 * package), since each instance would otherwise track its own count.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Buckets are only ever cleaned up lazily (on the next hit past `resetAt`),
// so a low-traffic abusive key could sit in memory a while — bounded by this
// periodic sweep instead of growing forever.
const SWEEP_INTERVAL_MS = 10 * 60_000;
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true, retryAfterSeconds: 0 };
}

/** Best-effort client identifier — trusts the platform's proxy header (set by
 * Vercel/most hosts) over a raw socket address, which Next's Edge runtime
 * doesn't expose directly. Never used for anything security-critical beyond
 * rate-limit bucketing. */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}
