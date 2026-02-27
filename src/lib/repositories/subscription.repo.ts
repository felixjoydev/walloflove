import type { TypedSupabaseClient } from "@shared/types/supabase";
import type { Database } from "@shared/types";
import type { PlanName } from "@shared/types";

type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];

export async function getSubscription(
  supabase: TypedSupabaseClient,
  userId: string
): Promise<SubscriptionRow | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function upsertSubscription(
  supabase: TypedSupabaseClient,
  data: {
    user_id: string;
    stripe_customer_id: string;
    stripe_subscription_id: string;
    plan: PlanName;
    status: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
  }
) {
  const { error } = await supabase.from("subscriptions").upsert(data, {
    onConflict: "user_id",
  });

  if (error) throw error;
}

export async function downgradeToFree(
  supabase: TypedSupabaseClient,
  userId: string
) {
  const { error } = await supabase
    .from("subscriptions")
    .update({
      plan: "free",
      status: "active",
      stripe_subscription_id: null,
      current_period_end: null,
      cancel_at_period_end: false,
    })
    .eq("user_id", userId);

  if (error) throw error;
}

export function getUserPlan(subscription: SubscriptionRow | null): PlanName {
  if (!subscription) return "free";
  if (subscription.status !== "active") return "free";
  return subscription.plan as PlanName;
}
