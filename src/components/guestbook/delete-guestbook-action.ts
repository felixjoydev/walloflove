"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  deleteGuestbook,
  listGuestbooks,
} from "@/lib/repositories/guestbook.repo";

export async function deleteGuestbookAction(guestbookId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  try {
    await deleteGuestbook(supabase, guestbookId);

    // Find where to redirect after deletion
    const remaining = await listGuestbooks(supabase, user.id);
    const redirectTo =
      remaining.length > 0
        ? `/guestbooks/${remaining[0].id}/inbox`
        : "/create-guestbook";

    return { error: null, redirectTo };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete";
    return { error: message, redirectTo: null };
  }
}
