"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteGuestbook } from "@/lib/repositories/guestbook.repo";

export async function deleteGuestbookAction(guestbookId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  try {
    await deleteGuestbook(supabase, guestbookId);
    return { error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete";
    return { error: message };
  }
}
