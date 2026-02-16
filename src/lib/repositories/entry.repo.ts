import type { TypedSupabaseClient } from "@shared/types/supabase";
import type { Database } from "@shared/types";
import type { EntryStatus } from "@shared/types";

type EntryInsert = Database["public"]["Tables"]["entries"]["Insert"];

export async function listApprovedEntries(
  supabase: TypedSupabaseClient,
  guestbookId: string,
  cursor: string | null,
  limit: number = 20
) {
  let query = supabase
    .from("entries")
    .select("id, name, message, link, stroke_data, created_at")
    .eq("guestbook_id", guestbookId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit + 1); // fetch one extra to determine if there's a next page

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;
  if (error) throw error;

  const hasMore = data.length > limit;
  const entries = hasMore ? data.slice(0, limit) : data;
  const nextCursor = hasMore ? entries[entries.length - 1].created_at : null;

  return { entries, cursor: nextCursor };
}

export async function listAllEntries(
  supabase: TypedSupabaseClient,
  guestbookId: string,
  status?: EntryStatus
) {
  let query = supabase
    .from("entries")
    .select("*")
    .eq("guestbook_id", guestbookId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createEntry(
  supabase: TypedSupabaseClient,
  entry: EntryInsert
) {
  const { data, error } = await supabase
    .from("entries")
    .insert(entry)
    .select("id, deletion_token")
    .single();

  if (error) throw error;
  return data;
}

export async function updateEntryStatus(
  supabase: TypedSupabaseClient,
  id: string,
  status: EntryStatus
) {
  const { error } = await supabase
    .from("entries")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
}

export async function bulkUpdateEntryStatus(
  supabase: TypedSupabaseClient,
  ids: string[],
  status: EntryStatus
) {
  const { error } = await supabase
    .from("entries")
    .update({ status })
    .in("id", ids);

  if (error) throw error;
}

export async function deleteEntry(
  supabase: TypedSupabaseClient,
  id: string
) {
  const { error } = await supabase.from("entries").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteEntryByToken(
  supabase: TypedSupabaseClient,
  entryId: string,
  deletionToken: string
) {
  const { data, error } = await supabase
    .from("entries")
    .delete()
    .eq("id", entryId)
    .eq("deletion_token", deletionToken)
    .select("id")
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data; // null if token didn't match
}

export async function countEntries(
  supabase: TypedSupabaseClient,
  guestbookId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("entries")
    .select("*", { count: "exact", head: true })
    .eq("guestbook_id", guestbookId);

  if (error) throw error;
  return count ?? 0;
}
