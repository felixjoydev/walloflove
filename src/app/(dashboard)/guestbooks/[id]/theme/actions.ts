"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getGuestbook,
  updateGuestbookSettings,
} from "@/lib/repositories/guestbook.repo";
import type { GuestbookSettings } from "@shared/types";

export async function saveThemeAction(
  guestbookId: string,
  theme: Partial<GuestbookSettings>
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
    await updateGuestbookSettings(supabase, guestbookId, theme);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to save" };
  }
}
