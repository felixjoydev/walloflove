export interface GuestbookSettings {
  background_color?: string;
  card_background_color?: string;
  text_color?: string;
  accent_color?: string;
  font?: "handwriting" | "sans" | "mono";
  card_border_radius?: number;
  canvas_background_color?: string;
  moderation_mode?: "auto_approve" | "manual_approve";
  cta_text?: string;
  max_entries_displayed?: number;
  show_link_field?: boolean;
  show_message_field?: boolean;
}

export const DEFAULT_SETTINGS: Required<GuestbookSettings> = {
  background_color: "transparent",
  card_background_color: "#ffffff",
  text_color: "#1a1a1a",
  accent_color: "#6366f1",
  font: "handwriting",
  card_border_radius: 12,
  canvas_background_color: "#ffffff",
  moderation_mode: "auto_approve",
  cta_text: "Sign the Guestbook",
  max_entries_displayed: 50,
  show_link_field: true,
  show_message_field: true,
} as const;

export function mergeSettings(
  stored: Partial<GuestbookSettings> | null
): Required<GuestbookSettings> {
  return { ...DEFAULT_SETTINGS, ...stored };
}

export type EntryStatus = "pending" | "approved" | "rejected";

export type PlanName = "free" | "starter" | "pro";

export type SubscriptionStatus = "active" | "canceled" | "past_due";
