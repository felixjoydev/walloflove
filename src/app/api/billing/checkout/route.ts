import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { getSubscription } from "@/lib/repositories/subscription.repo";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { priceId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.priceId || typeof body.priceId !== "string") {
    return NextResponse.json(
      { error: "priceId is required" },
      { status: 400 }
    );
  }

  // Get or create Stripe customer
  const subscription = await getSubscription(supabase, user.id);
  let customerId = subscription?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: body.priceId, quantity: 1 }],
    success_url: `${request.nextUrl.origin}/billing?success=true`,
    cancel_url: `${request.nextUrl.origin}/billing?canceled=true`,
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
  });

  return NextResponse.json({ url: session.url });
}
