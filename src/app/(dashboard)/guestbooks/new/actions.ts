"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createGuestbook } from "@/lib/repositories/guestbook.repo";

export async function createGuestbookAction(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  try {
    const guestbook = await createGuestbook(supabase, user.id, name);
    return { id: guestbook.id, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create guestbook";
    return { id: null, error: message };
  }
}
