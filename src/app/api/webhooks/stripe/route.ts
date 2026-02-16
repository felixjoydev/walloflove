import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  upsertSubscription,
  downgradeToFree,
} from "@/lib/repositories/subscription.repo";
import type Stripe from "stripe";

const PRICE_TO_PLAN: Record<string, "starter" | "pro"> = {
  [process.env.STRIPE_STARTER_PRICE_ID!]: "starter",
  [process.env.STRIPE_PRO_PRICE_ID!]: "pro",
};

function planFromPriceId(priceId: string): "starter" | "pro" {
  return PRICE_TO_PLAN[priceId] ?? "starter";
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error(
      "Stripe webhook signature verification failed:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription" || !session.subscription) break;

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = sub.metadata.supabase_user_id;
        if (!userId) {
          console.error("No supabase_user_id in subscription metadata");
          break;
        }

        const priceId = sub.items.data[0]?.price.id ?? "";

        await upsertSubscription(supabaseAdmin, {
          user_id: userId,
          stripe_customer_id:
            typeof sub.customer === "string" ? sub.customer : sub.customer.id,
          stripe_subscription_id: sub.id,
          plan: planFromPriceId(priceId),
          status: sub.status === "active" ? "active" : "past_due",
          current_period_end: new Date(
            sub.current_period_end * 1000
          ).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
        });
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata.supabase_user_id;
        if (!userId) break;

        const priceId = sub.items.data[0]?.price.id ?? "";

        await upsertSubscription(supabaseAdmin, {
          user_id: userId,
          stripe_customer_id:
            typeof sub.customer === "string" ? sub.customer : sub.customer.id,
          stripe_subscription_id: sub.id,
          plan: planFromPriceId(priceId),
          status: sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : "canceled",
          current_period_end: new Date(
            sub.current_period_end * 1000
          ).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata.supabase_user_id;
        if (!userId) break;

        await downgradeToFree(supabaseAdmin, userId);
        break;
      }

      default:
        // Unhandled event type — ignore
        break;
    }
  } catch (err) {
    console.error(
      `Stripe webhook error processing ${event.type}:`,
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
