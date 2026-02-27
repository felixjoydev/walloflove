import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { trackEvent } from "@/lib/repositories/analytics.repo";
import { visitorHash } from "@/lib/utils/hash";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { guestbook_id, event_type, page_type } = body;

    if (!guestbook_id || !event_type || !page_type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const allowedEventTypes = ["page_view", "submission", "widget_load"];
    const allowedPageTypes = ["wall", "collection", "widget"];

    if (!allowedEventTypes.includes(event_type) || !allowedPageTypes.includes(page_type)) {
      return NextResponse.json(
        { error: "Invalid event_type or page_type" },
        { status: 400 }
      );
    }

    // Validate guestbook exists (Postgres UUID column rejects invalid formats)
    const { data: guestbook } = await supabaseAdmin
      .from("guestbooks")
      .select("id")
      .eq("id", guestbook_id)
      .single();

    if (!guestbook) {
      return NextResponse.json(
        { error: "Guestbook not found" },
        { status: 404 }
      );
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const visitor_hash = visitorHash(ip, guestbook_id, "analytics");
    const referrer = request.headers.get("referer") ?? undefined;
    const user_agent = request.headers.get("user-agent") ?? undefined;
    const country = request.headers.get("x-vercel-ip-country") ?? undefined;

    await trackEvent(supabaseAdmin, {
      guestbook_id,
      event_type,
      page_type,
      visitor_hash,
      referrer,
      user_agent,
      country,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to track event" },
      { status: 500 }
    );
  }
}
