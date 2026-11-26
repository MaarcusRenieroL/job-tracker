import type { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";

export type RateLimitOptions = {
  maxRequests: number;
  windowMs: number;
};

export function createRateLimiter({
  maxRequests,
  windowMs,
}: RateLimitOptions): MiddlewareHandler {
  const buckets = new Map<string, number[]>();

  return createMiddleware(async (c, next) => {
    const forwarded = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
    const key = forwarded || c.req.header("x-real-ip")?.trim() || "local";
    const now = Date.now();
    const cutoff = now - windowMs;

    const recent = (buckets.get(key) ?? []).filter((ts) => ts > cutoff);
    if (recent.length >= maxRequests) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((recent[0] + windowMs - now) / 1000),
      );
      c.header("Retry-After", String(retryAfterSec));
      return c.json(
        {
          error: "Too many authentication attempts. Please wait and try again.",
          code: "RATE_LIMITED",
        },
        429,
      );
    }

    recent.push(now);
    buckets.set(key, recent);

    if (buckets.size > 1_000) {
      for (const [bucketKey, timestamps] of buckets) {
        if (!timestamps.some((ts) => ts > cutoff)) {
          buckets.delete(bucketKey);
        }
      }
    }

    await next();
  });
}
