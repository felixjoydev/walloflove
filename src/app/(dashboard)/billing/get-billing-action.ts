"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getSubscription,
  getUserPlan,
} from "@/lib/repositories/subscription.repo";
import type { PlanName } from "@shared/types";

export interface BillingData {
  currentPlan: PlanName;
  cancelAtPeriodEnd: boolean;
  periodEnd: string | null;
}

export async function getBillingDataAction(): Promise<{
  error: string | null;
  data?: BillingData;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const subscription = await getSubscription(supabase, user.id);
  const currentPlan = getUserPlan(subscription);

  const cancelAtPeriodEnd = subscription?.cancel_at_period_end ?? false;
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return {
    error: null,
    data: { currentPlan, cancelAtPeriodEnd, periodEnd },
  };
}
