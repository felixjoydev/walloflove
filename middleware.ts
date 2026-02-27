import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { Redis } from "@upstash/redis";

function isAppDomain(hostname: string): boolean {
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN;

  // Always treat localhost as app domain
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;

  // Vercel preview/staging domains
  if (hostname.endsWith(".vercel.app")) return true;

  // Configured production domain
  if (appDomain && (hostname === appDomain || hostname === `www.${appDomain}`)) {
    return true;
  }

  // If no app domain configured, treat everything as app domain (dev mode)
  if (!appDomain) return true;

  return false;
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":")[0] ?? "";

  // ─── Custom domain routing ───
  if (hostname && !isAppDomain(hostname)) {
    return handleCustomDomain(request, hostname);
  }

  // ─── Existing middleware logic ───

  // Handle CORS preflight for widget API
  if (request.nextUrl.pathname.startsWith("/api/v1/")) {
    if (request.method === "OPTIONS") {
      const response = new NextResponse(null, { status: 204 });
      addCorsHeaders(response);
      addSecurityHeaders(response);
      return response;
    }
    const response = NextResponse.next();
    addCorsHeaders(response);
    addSecurityHeaders(response);
    return response;
  }

  // Skip auth for webhooks
  if (request.nextUrl.pathname.startsWith("/api/webhooks/")) {
    const response = NextResponse.next();
    addSecurityHeaders(response);
    return response;
  }

  const response = await updateSession(request);
  addSecurityHeaders(response);
  return response;
}

async function handleCustomDomain(request: NextRequest, hostname: string) {
  const pathname = request.nextUrl.pathname;

  // Skip internal and static paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|css|js|woff|woff2|ttf)$/)
  ) {
    return NextResponse.next();
  }

  // Resolve domain → slug
  const mapping = await resolveDomainToSlug(hostname);

  if (!mapping) {
    return new NextResponse("Domain not configured", { status: 404 });
  }

  const { slug } = mapping;
  const url = request.nextUrl.clone();

  if (pathname === "/" || pathname === "") {
    url.pathname = `/wall/${slug}`;
    return NextResponse.rewrite(url);
  }

  if (pathname === "/collect") {
    url.pathname = `/collect/${slug}`;
    return NextResponse.rewrite(url);
  }

  return new NextResponse("Not found", { status: 404 });
}

async function resolveDomainToSlug(
  hostname: string
): Promise<{ slug: string; guestbookId: string } | null> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const hasRedis = !!(redisUrl && redisToken && redisUrl.startsWith("https://"));

  // 1. Check Redis cache
  if (hasRedis) {
    const redis = new Redis({ url: redisUrl!, token: redisToken! });
    const cacheKey = `domain:${hostname}`;
    const cached = await redis.get<string>(cacheKey);

    if (cached === "__none__") return null;
    if (cached) {
      try {
        return JSON.parse(cached) as { slug: string; guestbookId: string };
      } catch {
        // Fall through to DB lookup
      }
    }
  }

  // 2. Cache miss — query Supabase RPC via REST (edge-compatible)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/get_slug_by_domain`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ lookup_domain: hostname }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const mapping = data?.[0];

  // 3. Cache the result
  if (hasRedis) {
    const redis = new Redis({ url: redisUrl!, token: redisToken! });
    const cacheKey = `domain:${hostname}`;

    if (!mapping) {
      await redis.set(cacheKey, "__none__", { ex: 60 });
      return null;
    }

    const result = { slug: mapping.slug, guestbookId: mapping.guestbook_id };
    await redis.set(cacheKey, JSON.stringify(result), { ex: 3600 });
    return result;
  }

  if (!mapping) return null;
  return { slug: mapping.slug, guestbookId: mapping.guestbook_id };
}

function addCorsHeaders(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, If-None-Match");
}

function addSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set(
    "Referrer-Policy",
    "strict-origin-when-cross-origin"
  );
  response.headers.set("X-Frame-Options", "DENY");
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|widget/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
