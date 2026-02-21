export interface GuestbookSettings {
  background_color?: string;
  card_background_color?: string;
  text_color?: string;
  card_text_color?: string;
  accent_color?: string;
  font?: "handwriting" | "sans" | "mono";
  card_border_radius?: number;
  canvas_background_color?: string;
  moderation_mode?: "auto_approve" | "manual_approve";
  cta_text?: string;
  max_entries_displayed?: number;
  show_link_field?: boolean;
  show_message_field?: boolean;
  logo_url?: string | null;
  brand_color?: string;
  wall_title?: string;
  wall_description?: string;
  collection_title?: string;
  collection_description?: string;
  widget_title?: string;
  widget_description?: string;
  wall_layout?: "grid" | "masonry";
  website_text?: string;
  website_link?: string;
  button_text_color?: string;
  button_border_radius?: number;
}

export const DEFAULT_SETTINGS: Required<GuestbookSettings> = {
  background_color: "#FBFBFB",
  card_background_color: "#ffffff",
  text_color: "#1a1a1a",
  card_text_color: "#1a1a1a",
  accent_color: "#6366f1",
  font: "sans",
  card_border_radius: 12,
  canvas_background_color: "#F6F6F6",
  moderation_mode: "auto_approve",
  cta_text: "Sign the Guestbook",
  max_entries_displayed: 50,
  show_link_field: true,
  show_message_field: true,
  logo_url: null,
  brand_color: "#6366f1",
  wall_title: "Wall of Love",
  wall_description: "See what people are saying",
  collection_title: "Sign our Guestbook",
  collection_description: "Leave your mark with a scribble",
  widget_title: "Guestbook",
  widget_description: "See what our customers are scribbling",
  wall_layout: "masonry",
  website_text: "Visit our website",
  website_link: "",
  button_text_color: "#ffffff",
  button_border_radius: 9999,
} as const;

export function mergeSettings(
  stored: Partial<GuestbookSettings> | null
): Required<GuestbookSettings> {
  return { ...DEFAULT_SETTINGS, ...stored };
}

export type EntryStatus = "pending" | "approved" | "rejected";

export type PlanName = "free" | "starter" | "pro";

export type SubscriptionStatus = "active" | "canceled" | "past_due";
