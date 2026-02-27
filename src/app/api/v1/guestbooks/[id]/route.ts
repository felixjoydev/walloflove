import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getApiReadLimiter } from "@/lib/utils/rate-limit";
import {
  getSubscription,
  getUserPlan,
} from "@/lib/repositories/subscription.repo";
import { PLANS } from "@/lib/stripe/config";
import { mergeSettings } from "@shared/types";
import type { GuestbookConfig } from "@shared/types";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
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
  const { success } = await getApiReadLimiter().limit(ip);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: corsHeaders() }
    );
  }

  const { data: guestbook, error } = await supabaseAdmin
    .from("guestbooks")
    .select("id, name, settings, user_id")
    .eq("id", id)
    .single();

  if (error || !guestbook) {
    return NextResponse.json(
      { error: "Guestbook not found" },
      { status: 404, headers: corsHeaders() }
    );
  }

  // Look up subscription to determine branding
  const subscription = await getSubscription(supabaseAdmin, guestbook.user_id);
  const plan = getUserPlan(subscription);

  const config: GuestbookConfig = {
    id: guestbook.id,
    name: guestbook.name,
    settings: mergeSettings(
      guestbook.settings as Record<string, unknown> | null
    ),
    branding: PLANS[plan].branding,
  };

  return NextResponse.json(config, {
    headers: {
      ...corsHeaders(),
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
    },
  });
}
