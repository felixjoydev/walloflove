import type { TypedSupabaseClient } from "@shared/types/supabase";
import type { Database } from "@shared/types";
import type { GuestbookSettings } from "@shared/types";

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
  const { data, error } = await supabase
    .from("guestbooks")
    .insert({ user_id: userId, name, slug: null, settings: {} })
    .select()
    .single();

  if (error) throw error;
  return data;
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
  const { data, error } = await supabase
    .from("guestbooks")
    .update({ settings: settings as Record<string, unknown> })
    .eq("id", id)
    .select("settings")
    .single();

  if (error) throw error;
  return data?.settings;
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

/** Look up a guestbook by its verified custom domain via RPC (bypasses RLS). */
export async function getGuestbookByDomain(
  supabase: TypedSupabaseClient,
  domain: string
): Promise<{ slug: string; guestbook_id: string } | null> {
  const { data, error } = await supabase.rpc("get_slug_by_domain", {
    lookup_domain: domain,
  });

  if (error) throw error;
  return data?.[0] ?? null;
}

/** Update domain-related columns on a guestbook. */
export async function updateGuestbookDomain(
  supabase: TypedSupabaseClient,
  id: string,
  fields: {
    custom_domain?: string | null;
    domain_verified?: boolean;
    domain_vercel_status?: string;
    domain_verification_data?: Record<string, unknown> | null;
  }
) {
  const { data, error } = await supabase
    .from("guestbooks")
    .update(fields)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Check if a domain is already claimed by another guestbook. */
export async function isDomainTaken(
  supabase: TypedSupabaseClient,
  domain: string,
  excludeGuestbookId?: string
): Promise<boolean> {
  let query = supabase
    .from("guestbooks")
    .select("id", { count: "exact", head: true })
    .eq("custom_domain", domain);

  if (excludeGuestbookId) {
    query = query.neq("id", excludeGuestbookId);
  }

  const { count, error } = await query;
  if (error) throw error;
  return (count ?? 0) > 0;
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
