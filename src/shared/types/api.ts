import type { GuestbookSettings } from "./guestbook";
import type { DrawingData } from "./drawing";

// Widget API response types

export interface GuestbookConfig {
  id: string;
  name: string;
  settings: Required<GuestbookSettings>;
  branding: boolean;
}

export interface EntryResponse {
  id: string;
  name: string;
  message: string | null;
  link: string | null;
  stroke_data: DrawingData;
  created_at: string;
}

export interface EntriesListResponse {
  entries: EntryResponse[];
  cursor: string | null;
}

export interface SubmitEntryRequest {
  name: string;
  message?: string;
  link?: string;
  stroke_data: DrawingData;
  _hp?: string; // honeypot field
}

export interface SubmitEntryResponse {
  id: string;
  deletion_token: string;
}

export interface ApiError {
  error: string;
  code?: string;
}
