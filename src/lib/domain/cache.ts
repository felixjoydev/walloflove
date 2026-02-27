import "server-only";
import { Redis } from "@upstash/redis";

const CACHE_TTL = 3600; // 1 hour for positive lookups
const NEGATIVE_CACHE_TTL = 60; // 1 minute for "domain not found"
const KEY_PREFIX = "domain:";

function isConfigured() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return !!(url && token && url.startsWith("https://"));
}

function getRedis() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

interface CachedDomainMapping {
  slug: string;
  guestbookId: string;
}

/**
 * Look up domain mapping from cache.
 * Returns mapping on hit, "__none__" for negative cache, null on miss.
 */
export async function getCachedDomainMapping(
  domain: string
): Promise<CachedDomainMapping | "__none__" | null> {
  if (!isConfigured()) return null;
  const redis = getRedis();
  const cached = await redis.get<string>(`${KEY_PREFIX}${domain}`);
  if (!cached) return null;
  if (cached === "__none__") return "__none__";
  try {
    return JSON.parse(cached) as CachedDomainMapping;
  } catch {
    return null;
  }
}

/**
 * Store a domain -> slug/guestbookId mapping in cache (1hr TTL).
 */
export async function cacheDomainMapping(
  domain: string,
  mapping: CachedDomainMapping
): Promise<void> {
  if (!isConfigured()) return;
  const redis = getRedis();
  await redis.set(`${KEY_PREFIX}${domain}`, JSON.stringify(mapping), {
    ex: CACHE_TTL,
  });
}

/**
 * Store a negative cache entry — domain not found / not verified (1min TTL).
 */
export async function cacheNegativeDomainLookup(
  domain: string
): Promise<void> {
  if (!isConfigured()) return;
  const redis = getRedis();
  await redis.set(`${KEY_PREFIX}${domain}`, "__none__", {
    ex: NEGATIVE_CACHE_TTL,
  });
}

/**
 * Invalidate cache for a domain. Call on add/remove/verify.
 */
export async function invalidateDomainCache(domain: string): Promise<void> {
  if (!isConfigured()) return;
  const redis = getRedis();
  await redis.del(`${KEY_PREFIX}${domain}`);
}
