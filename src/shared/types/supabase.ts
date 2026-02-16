import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TypedSupabaseClient = SupabaseClient<Database, "public", any>;
