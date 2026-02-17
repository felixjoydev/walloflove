import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function isRedisConfigured(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return !!(url && token && url.startsWith("https://") && !url.includes("..."));
}

function getRedis() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

// No-op limiter that always allows requests (used when Redis is not configured)
const noopLimiter = {
  limit: async () => ({ success: true, limit: 0, remaining: 0, reset: 0 }),
};

let _entrySubmitLimiter: Ratelimit | typeof noopLimiter | null = null;
let _apiReadLimiter: Ratelimit | typeof noopLimiter | null = null;

// 3 entry submissions per hour per visitor per guestbook
export function getEntrySubmitLimiter() {
  if (!_entrySubmitLimiter) {
    if (!isRedisConfigured()) {
      _entrySubmitLimiter = noopLimiter;
    } else {
      _entrySubmitLimiter = new Ratelimit({
        redis: getRedis(),
        limiter: Ratelimit.slidingWindow(3, "1 h"),
        analytics: true,
        prefix: "ratelimit:entry-submit",
      });
    }
  }
  return _entrySubmitLimiter;
}

// 60 API reads per minute per IP
export function getApiReadLimiter() {
  if (!_apiReadLimiter) {
    if (!isRedisConfigured()) {
      _apiReadLimiter = noopLimiter;
    } else {
      _apiReadLimiter = new Ratelimit({
        redis: getRedis(),
        limiter: Ratelimit.slidingWindow(60, "1 m"),
        analytics: true,
        prefix: "ratelimit:api-read",
      });
    }
  }
  return _apiReadLimiter;
}
