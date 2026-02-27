// This file will be overwritten by `npx supabase gen types typescript`
// Placeholder types until Supabase project is connected

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      guestbooks: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          slug: string | null;
          settings: Json;
          custom_domain: string | null;
          domain_verified: boolean;
          domain_vercel_status: string;
          domain_verification_data: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          slug?: string | null;
          settings?: Json;
          custom_domain?: string | null;
          domain_verified?: boolean;
          domain_vercel_status?: string;
          domain_verification_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          slug?: string | null;
          settings?: Json;
          custom_domain?: string | null;
          domain_verified?: boolean;
          domain_vercel_status?: string;
          domain_verification_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "guestbooks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      entries: {
        Row: {
          id: string;
          guestbook_id: string;
          name: string;
          message: string | null;
          link: string | null;
          stroke_data: Json;
          status: string;
          visitor_hash: string;
          deletion_token: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          guestbook_id: string;
          name: string;
          message?: string | null;
          link?: string | null;
          stroke_data: Json;
          status?: string;
          visitor_hash: string;
          deletion_token?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          guestbook_id?: string;
          name?: string;
          message?: string | null;
          link?: string | null;
          stroke_data?: Json;
          status?: string;
          visitor_hash?: string;
          deletion_token?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "entries_guestbook_id_fkey";
            columns: ["guestbook_id"];
            isOneToOne: false;
            referencedRelation: "guestbooks";
            referencedColumns: ["id"];
          },
        ];
      };
      analytics_events: {
        Row: {
          id: string;
          guestbook_id: string;
          event_type: string;
          page_type: string;
          visitor_hash: string | null;
          country: string | null;
          referrer: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          guestbook_id: string;
          event_type: string;
          page_type: string;
          visitor_hash?: string | null;
          country?: string | null;
          referrer?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          guestbook_id?: string;
          event_type?: string;
          page_type?: string;
          visitor_hash?: string | null;
          country?: string | null;
          referrer?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "analytics_events_guestbook_id_fkey";
            columns: ["guestbook_id"];
            isOneToOne: false;
            referencedRelation: "guestbooks";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          plan: string;
          status: string;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: string;
          status?: string;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: string;
          status?: string;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_slug_by_domain: {
        Args: { lookup_domain: string };
        Returns: { slug: string; guestbook_id: string }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
