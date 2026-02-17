import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
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
