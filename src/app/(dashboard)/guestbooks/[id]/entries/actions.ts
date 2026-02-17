"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  updateEntryStatus,
  bulkUpdateEntryStatus,
  deleteEntry,
} from "@/lib/repositories/entry.repo";
import { getGuestbook } from "@/lib/repositories/guestbook.repo";
import {
  getSubscription,
  getUserPlan,
} from "@/lib/repositories/subscription.repo";
import { PLANS } from "@/lib/stripe/config";
import type { EntryStatus } from "@shared/types";

async function getAuthedGuestbook(guestbookId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const guestbook = await getGuestbook(supabase, guestbookId);
  if (!guestbook || guestbook.user_id !== user.id) {
    return { supabase, error: "Not found" as const, canModerate: false };
  }

  const subscription = await getSubscription(supabase, user.id);
  const plan = getUserPlan(subscription);
  return { supabase, error: null, canModerate: PLANS[plan].moderation };
}

export async function updateEntryStatusAction(
  guestbookId: string,
  entryId: string,
  status: EntryStatus
) {
  const { supabase, error, canModerate } = await getAuthedGuestbook(guestbookId);
  if (error) return { error };
  if (!canModerate) return { error: "Moderation requires a paid plan" };

  try {
    await updateEntryStatus(supabase, entryId, status);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function bulkUpdateAction(
  guestbookId: string,
  entryIds: string[],
  status: EntryStatus
) {
  const { supabase, error, canModerate } = await getAuthedGuestbook(guestbookId);
  if (error) return { error };
  if (!canModerate) return { error: "Moderation requires a paid plan" };

  try {
    await bulkUpdateEntryStatus(supabase, entryIds, status);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function deleteEntryAction(
  guestbookId: string,
  entryId: string
) {
  const { supabase, error, canModerate } = await getAuthedGuestbook(guestbookId);
  if (error) return { error };
  if (!canModerate) return { error: "Moderation requires a paid plan" };

  try {
    await deleteEntry(supabase, entryId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed" };
  }
}
