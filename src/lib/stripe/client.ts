import "server-only";

import Stripe from "stripe";

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return null;
  }
  return new Stripe(key, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  });
}

let _stripe: Stripe | null | undefined;

export function getStripe(): Stripe | null {
  if (_stripe === undefined) {
    _stripe = getStripeClient();
  }
  return _stripe;
}

// For backward compatibility — throws if Stripe is not configured
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    const client = getStripe();
    if (!client) {
      throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY env var.");
    }
    return (client as unknown as Record<string | symbol, unknown>)[prop];
  },
});
