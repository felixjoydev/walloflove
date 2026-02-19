import type { TypedSupabaseClient } from "@shared/types/supabase";
import type { Database } from "@shared/types";
import type { GuestbookSettings } from "@shared/types";
import { generateUniqueSlug } from "@/lib/utils/slug";

type GuestbookRow = Database["public"]["Tables"]["guestbooks"]["Row"];

export async function listGuestbooks(
  supabase: TypedSupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("guestbooks")
    .select("*, entries(count)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getGuestbook(
  supabase: TypedSupabaseClient,
  id: string
): Promise<GuestbookRow | null> {
  const { data, error } = await supabase
    .from("guestbooks")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function getGuestbookBySlug(
  supabase: TypedSupabaseClient,
  slug: string
): Promise<GuestbookRow | null> {
  const { data, error } = await supabase
    .from("guestbooks")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

/** Public-safe projection — only returns columns safe for anonymous access */
export async function getPublicGuestbookBySlug(
  supabase: TypedSupabaseClient,
  slug: string
): Promise<{ id: string; name: string; slug: string; settings: unknown } | null> {
  const { data, error } = await supabase
    .from("guestbooks")
    .select("id, name, slug, settings")
    .eq("slug", slug)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function createGuestbook(
  supabase: TypedSupabaseClient,
  userId: string,
  name: string
) {
  // Retry on slug collision (TOCTOU between check and insert)
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = await generateUniqueSlug(supabase, name);
    const { data, error } = await supabase
      .from("guestbooks")
      .insert({ user_id: userId, name, slug, settings: {} })
      .select()
      .single();

    if (!error) return data;

    // Unique constraint violation — retry with a new slug
    if (error.code === "23505") continue;
    throw error;
  }
  throw new Error("Failed to generate a unique slug after retries");
}

export async function updateGuestbookSlug(
  supabase: TypedSupabaseClient,
  id: string,
  slug: string
) {
  const { data, error } = await supabase
    .from("guestbooks")
    .update({ slug })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateGuestbookSettings(
  supabase: TypedSupabaseClient,
  id: string,
  settings: Partial<GuestbookSettings>
) {
  // Atomic JSONB merge — no race condition, single round-trip
  const { data, error } = await supabase.rpc("merge_guestbook_settings", {
    guestbook_id: id,
    new_settings: settings as Record<string, unknown>,
  });

  if (error) throw error;
  return data;
}

export async function updateGuestbookName(
  supabase: TypedSupabaseClient,
  id: string,
  name: string
) {
  const { data, error } = await supabase
    .from("guestbooks")
    .update({ name })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteGuestbook(
  supabase: TypedSupabaseClient,
  id: string
) {
  const { error } = await supabase.from("guestbooks").delete().eq("id", id);
  if (error) throw error;
}

export async function countGuestbooks(
  supabase: TypedSupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("guestbooks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw error;
  return count ?? 0;
}
