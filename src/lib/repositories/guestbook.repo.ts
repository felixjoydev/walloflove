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

export async function createGuestbook(
  supabase: TypedSupabaseClient,
  userId: string,
  name: string
) {
  const { data, error } = await supabase
    .from("guestbooks")
    .insert({ user_id: userId, name, settings: {} })
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
    .select()
    .single();

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
