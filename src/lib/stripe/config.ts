import type { PlanName } from "@shared/types";

interface PlanConfig {
  guestbooks: number; // -1 = unlimited
  entries: number;
  branding: boolean;
  moderation: boolean;
  fullTheme: boolean;
}

export const PLANS = {
  free: {
    guestbooks: -1,
    entries: Infinity,
    branding: false,
    moderation: true,
    fullTheme: true,
  },
  starter: {
    guestbooks: 3,
    entries: Infinity,
    branding: false,
    moderation: true,
    fullTheme: true,
  },
  pro: {
    guestbooks: -1,
    entries: Infinity,
    branding: false,
    moderation: true,
    fullTheme: true,
  },
} as const satisfies Record<PlanName, PlanConfig>;

export function canAccess(
  feature: keyof PlanConfig,
  plan: PlanName
): boolean | number {
  return PLANS[plan][feature];
}

export function getGuestbookLimit(plan: PlanName): number {
  return PLANS[plan].guestbooks;
}

export function getEntryLimit(plan: PlanName): number {
  return PLANS[plan].entries;
}

export function getPriceId(plan: PlanName): string | null {
  if (plan === "starter") return process.env.STRIPE_STARTER_PRICE_ID ?? null;
  if (plan === "pro") return process.env.STRIPE_PRO_PRICE_ID ?? null;
  return null;
}
