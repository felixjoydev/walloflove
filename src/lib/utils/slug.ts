import type { TypedSupabaseClient } from "@shared/types/supabase";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function randomSuffix(): string {
  return Math.random().toString(36).substring(2, 6);
}

export async function generateUniqueSlug(
  supabase: TypedSupabaseClient,
  name: string
): Promise<string> {
  const base = toSlug(name) || "guestbook";

  // Try the base slug first
  const { data: existing } = await supabase
    .from("guestbooks")
    .select("id")
    .eq("slug", base)
    .maybeSingle();

  if (!existing) return base;

  // Collision — append random suffix, retry up to 5 times
  for (let i = 0; i < 5; i++) {
    const candidate = `${base}-${randomSuffix()}`;
    const { data } = await supabase
      .from("guestbooks")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!data) return candidate;
  }

  // Fallback: timestamp-based
  return `${base}-${Date.now().toString(36)}`;
}
