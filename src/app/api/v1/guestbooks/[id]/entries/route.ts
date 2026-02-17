import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  listApprovedEntries,
  createEntry,
  countEntries,
} from "@/lib/repositories/entry.repo";
import { getEntrySubmitLimiter, getApiReadLimiter } from "@/lib/utils/rate-limit";
import { visitorHash } from "@/lib/utils/hash";
import {
  stripHtml,
  isValidLink,
  validateStrokeData,
} from "@/lib/utils/sanitize";
import { mergeSettings } from "@shared/types";
import type { GuestbookSettings } from "@shared/types";
import type { Json } from "@shared/types/database";
import {
  getSubscription,
  getUserPlan,
} from "@/lib/repositories/subscription.repo";
import { getEntryLimit, PLANS } from "@/lib/stripe/config";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, If-None-Match",
  };
}

function generateEntriesEtag(result: {
  cursor: string | null;
  entries: Array<{ id: string; created_at: string }>;
}): string {
  const payload = JSON.stringify({
    cursor: result.cursor,
    entries: result.entries.map((entry) => [entry.id, entry.created_at]),
  });

  const digest = createHash("sha1").update(payload).digest("hex");
  return `"${digest}"`;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Rate limit
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const { success: allowed } = await getApiReadLimiter().limit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: corsHeaders() }
    );
  }

  const cursor = request.nextUrl.searchParams.get("cursor");

  try {
    const result = await listApprovedEntries(supabaseAdmin, id, cursor, 20);

    const etag = generateEntriesEtag(result);

    const ifNoneMatch = request.headers.get("If-None-Match");
    if (ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: corsHeaders(),
      });
    }

    return NextResponse.json(result, {
      headers: {
        ...corsHeaders(),
        ETag: etag,
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch entries" },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: guestbookId } = await params;

  // Verify guestbook exists and get settings
  const { data: guestbook } = await supabaseAdmin
    .from("guestbooks")
    .select("id, user_id, settings")
    .eq("id", guestbookId)
    .single();

  if (!guestbook) {
    return NextResponse.json(
      { error: "Guestbook not found" },
      { status: 404, headers: corsHeaders() }
    );
  }

  const settings = mergeSettings(
    guestbook.settings as Partial<GuestbookSettings> | null
  );

  // Enforce plan entry limits for the guestbook owner
  const subscription = await getSubscription(supabaseAdmin, guestbook.user_id);
  const plan = getUserPlan(subscription);
  const entryLimit = getEntryLimit(plan);
  if (Number.isFinite(entryLimit)) {
    const entryCount = await countEntries(supabaseAdmin, guestbookId);
    if (entryCount >= entryLimit) {
      return NextResponse.json(
        { error: "Entry limit reached for this guestbook" },
        { status: 403, headers: corsHeaders() }
      );
    }
  }

  // Get visitor IP for rate limiting
  const { headers: getHeaders } = await import("next/headers");
  const hdrs = await getHeaders();
  const forwarded = hdrs.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const hash = visitorHash(
    ip,
    guestbookId,
    process.env.RATE_LIMIT_SALT ?? "default-salt"
  );

  // Rate limit check
  const { success } = await getEntrySubmitLimiter().limit(
    `${hash}:${guestbookId}`
  );
  if (!success) {
    return NextResponse.json(
      { error: "Too many submissions. Try again later." },
      { status: 429, headers: corsHeaders() }
    );
  }

  // Parse body
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400, headers: corsHeaders() }
    );
  }

  // Honeypot check — if the hidden field is filled, silently accept but don't store
  if (body._hp) {
    return NextResponse.json(
      { id: crypto.randomUUID(), deletion_token: crypto.randomUUID() },
      { status: 201, headers: corsHeaders() }
    );
  }

  // Validate required fields
  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400, headers: corsHeaders() }
    );
  }

  // Validate stroke data
  if (!validateStrokeData(body.stroke_data)) {
    return NextResponse.json(
      { error: "Invalid or oversized drawing data" },
      { status: 400, headers: corsHeaders() }
    );
  }

  // Sanitize inputs
  const name = stripHtml(String(body.name).trim()).slice(0, 100);
  let message: string | null = null;
  let link: string | null = null;

  if (body.message && settings.show_message_field) {
    message = stripHtml(String(body.message).trim()).slice(0, 200) || null;
  }

  if (body.link && settings.show_link_field) {
    const rawLink = String(body.link).trim().slice(0, 500);
    if (rawLink && !isValidLink(rawLink)) {
      return NextResponse.json(
        { error: "Link must be a valid HTTPS URL" },
        { status: 400, headers: corsHeaders() }
      );
    }
    link = rawLink || null;
  }

  // Determine status based on moderation mode
  const moderationMode = PLANS[plan].moderation
    ? settings.moderation_mode
    : "auto_approve";
  const status = moderationMode === "auto_approve" ? "approved" : "pending";

  try {
    const entry = await createEntry(supabaseAdmin, {
      guestbook_id: guestbookId,
      name,
      message,
      link,
      stroke_data: body.stroke_data as unknown as Json,
      status,
      visitor_hash: hash,
    });

    return NextResponse.json(
      { id: entry.id, deletion_token: entry.deletion_token },
      { status: 201, headers: corsHeaders() }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to create entry" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
