import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function getRedis() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

let _entrySubmitLimiter: Ratelimit | null = null;
let _apiReadLimiter: Ratelimit | null = null;

// 3 entry submissions per hour per visitor per guestbook
export function getEntrySubmitLimiter() {
  if (!_entrySubmitLimiter) {
    _entrySubmitLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(3, "1 h"),
      analytics: true,
      prefix: "ratelimit:entry-submit",
    });
  }
  return _entrySubmitLimiter;
}

// 60 API reads per minute per IP
export function getApiReadLimiter() {
  if (!_apiReadLimiter) {
    _apiReadLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      analytics: true,
      prefix: "ratelimit:api-read",
    });
  }
  return _apiReadLimiter;
}
