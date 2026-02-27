import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getSubscription,
  getUserPlan,
} from "@/lib/repositories/subscription.repo";
import { PLANS } from "@/lib/stripe/config";
import type { PlanName } from "@shared/types";
import { BillingActions } from "./billing-actions";

const PLAN_DISPLAY: Record<
  PlanName,
  { label: string; price: string; features: string[] }
> = {
  free: {
    label: "Free",
    price: "$0",
    features: [
      "1 guestbook",
      "50 entries",
      "SignBoard branding",
      "Auto-approve only",
    ],
  },
  starter: {
    label: "Starter",
    price: "$7/mo",
    features: [
      "3 guestbooks",
      "Unlimited entries",
      "No branding",
      "Manual moderation",
      "Full theme customization",
    ],
  },
  pro: {
    label: "Pro",
    price: "$15/mo",
    features: [
      "Unlimited guestbooks",
      "Unlimited entries",
      "No branding",
      "Manual moderation",
      "Full theme customization",
      "Priority support",
    ],
  },
};

export default async function BillingPage() {
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

  return (
    <div>
      <h1 className="text-2xl font-bold">Billing</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Manage your subscription and plan.
      </p>

      {/* Current plan */}
      <div className="mt-8 rounded-xl border border-neutral-200 p-6">
        <p className="text-sm font-medium text-neutral-500">Current plan</p>
        <p className="mt-1 text-2xl font-bold">
          {PLAN_DISPLAY[currentPlan].label}
        </p>
        {periodEnd && (
          <p className="mt-1 text-sm text-neutral-500">
            {cancelAtPeriodEnd
              ? `Cancels on ${periodEnd}`
              : `Renews on ${periodEnd}`}
          </p>
        )}
        {currentPlan !== "free" && (
          <BillingActions
            action="portal"
            className="mt-4 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
          >
            Manage subscription
          </BillingActions>
        )}
      </div>

      {/* Pricing table */}
      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {(Object.keys(PLANS) as PlanName[]).map((plan) => {
          const display = PLAN_DISPLAY[plan];
          const isCurrent = plan === currentPlan;

          return (
            <div
              key={plan}
              className={`rounded-xl border p-6 ${
                isCurrent
                  ? "border-neutral-900 ring-1 ring-neutral-900"
                  : "border-neutral-200"
              }`}
            >
              <p className="text-sm font-medium text-neutral-500">
                {display.label}
              </p>
              <p className="mt-2 text-3xl font-bold">{display.price}</p>

              <ul className="mt-4 space-y-2">
                {display.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-neutral-600"
                  >
                    <span className="mt-0.5 text-neutral-400">&#10003;</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {isCurrent ? (
                  <div className="rounded-lg bg-neutral-100 px-4 py-2 text-center text-sm font-medium text-neutral-500">
                    Current plan
                  </div>
                ) : plan === "free" ? (
                  currentPlan !== "free" ? (
                    <BillingActions
                      action="portal"
                      className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
                    >
                      Downgrade
                    </BillingActions>
                  ) : null
                ) : (
                  <BillingActions
                    action="checkout"
                    plan={plan}
                    className="w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                  >
                    {currentPlan === "free" ? "Upgrade" : "Change plan"}
                  </BillingActions>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
