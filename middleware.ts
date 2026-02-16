import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Skip auth for widget API and webhooks
  if (
    request.nextUrl.pathname.startsWith("/api/v1/") ||
    request.nextUrl.pathname.startsWith("/api/webhooks/")
  ) {
    const response = NextResponse.next();
    addSecurityHeaders(response);
    return response;
  }

  const response = await updateSession(request);
  addSecurityHeaders(response);
  return response;
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
