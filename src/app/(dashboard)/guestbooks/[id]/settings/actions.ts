"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getGuestbook,
  updateGuestbookSettings,
  updateGuestbookName,
  updateGuestbookSlug,
} from "@/lib/repositories/guestbook.repo";
import {
  getSubscription,
  getUserPlan,
} from "@/lib/repositories/subscription.repo";
import { PLANS } from "@/lib/stripe/config";
import type { GuestbookSettings } from "@shared/types";

// Allowlist of valid settings keys to prevent arbitrary JSONB injection
const ALLOWED_SETTINGS_KEYS: Set<keyof GuestbookSettings> = new Set([
  "background_color",
  "card_background_color",
  "text_color",
  "accent_color",
  "font",
  "card_border_radius",
  "canvas_background_color",
  "moderation_mode",
  "cta_text",
  "max_entries_displayed",
  "show_link_field",
  "show_message_field",
  "logo_url",
  "brand_color",
  "wall_title",
  "wall_description",
  "collection_title",
  "collection_description",
  "widget_title",
  "widget_description",
  "wall_layout",
]);

function sanitizeSettings(
  input: Partial<GuestbookSettings>
): Partial<GuestbookSettings> {
  const clean: Partial<GuestbookSettings> = {};
  for (const key of Object.keys(input) as (keyof GuestbookSettings)[]) {
    if (ALLOWED_SETTINGS_KEYS.has(key)) {
      (clean as Record<string, unknown>)[key] = input[key];
    }
  }
  return clean;
}

export async function saveSettingsAction(
  guestbookId: string,
  settings: Partial<GuestbookSettings>
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const guestbook = await getGuestbook(supabase, guestbookId);
  if (!guestbook || guestbook.user_id !== user.id) {
    return { error: "Not found" };
  }

  try {
    const sanitized = sanitizeSettings(settings);

    const subscription = await getSubscription(supabase, user.id);
    const plan = getUserPlan(subscription);
    if (
      sanitized.moderation_mode === "manual_approve" &&
      !PLANS[plan].moderation
    ) {
      return { error: "Manual moderation requires a paid plan" };
    }

    await updateGuestbookSettings(supabase, guestbookId, sanitized);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to save" };
  }
}

export async function renameGuestbookAction(
  guestbookId: string,
  name: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const guestbook = await getGuestbook(supabase, guestbookId);
  if (!guestbook || guestbook.user_id !== user.id) {
    return { error: "Not found" };
  }

  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 100) {
    return { error: "Name must be between 1 and 100 characters" };
  }

  try {
    await updateGuestbookName(supabase, guestbookId, trimmed);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to rename" };
  }
}

export async function updateSlugAction(guestbookId: string, slug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const guestbook = await getGuestbook(supabase, guestbookId);
  if (!guestbook || guestbook.user_id !== user.id) {
    return { error: "Not found" };
  }

  // Validate slug format and length
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug)) {
    return { error: "Slug must be lowercase alphanumeric with hyphens" };
  }
  if (slug.length < 3 || slug.length > 64) {
    return { error: "Slug must be between 3 and 64 characters" };
  }

  try {
    await updateGuestbookSlug(supabase, guestbookId, slug);
    return { error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update slug";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return { error: "This slug is already taken" };
    }
    return { error: msg };
  }
}
