"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createGuestbook,
  countGuestbooks,
} from "@/lib/repositories/guestbook.repo";
import {
  getSubscription,
  getUserPlan,
} from "@/lib/repositories/subscription.repo";
import { getGuestbookLimit } from "@/lib/stripe/config";

export async function createGuestbookAction(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  try {
    const subscription = await getSubscription(supabase, user.id);
    const plan = getUserPlan(subscription);
    const guestbookLimit = getGuestbookLimit(plan);
    if (guestbookLimit >= 0) {
      const guestbookCount = await countGuestbooks(supabase, user.id);
      if (guestbookCount >= guestbookLimit) {
        return { id: null, error: "Guestbook limit reached for your plan" };
      }
    }

    const guestbook = await createGuestbook(supabase, user.id, name);
    return { id: guestbook.id, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create guestbook";
    return { id: null, error: message };
  }
}
