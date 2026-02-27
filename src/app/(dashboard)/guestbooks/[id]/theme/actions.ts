"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getGuestbook,
  updateGuestbookSettings,
  updateGuestbookSlug,
} from "@/lib/repositories/guestbook.repo";
import { generateUniqueSlug } from "@/lib/utils/slug";
import type { GuestbookSettings } from "@shared/types";

export async function uploadLogoAction(
  guestbookId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const guestbook = await getGuestbook(supabase, guestbookId);
  if (!guestbook || guestbook.user_id !== user.id) {
    return { error: "Not found", url: null };
  }

  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file provided", url: null };

  const ext = file.name.split(".").pop() ?? "png";
  const path = `${user.id}/${guestbookId}/logo.${ext}`;

  const { error } = await supabase.storage
    .from("logos")
    .upload(path, file, { upsert: true });

  if (error) return { error: error.message, url: null };

  const { data: urlData } = supabase.storage
    .from("logos")
    .getPublicUrl(path);

  // Append cache-buster so the browser fetches the new file and the URL
  // differs from the previously saved logo_url (same storage path on re-upload).
  const url = `${urlData.publicUrl}?t=${Date.now()}`;
  return { error: null, url };
}

export async function saveThemeAction(
  guestbookId: string,
  theme: Partial<GuestbookSettings>
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const guestbook = await getGuestbook(supabase, guestbookId);
  if (!guestbook || guestbook.user_id !== user.id) {
    return { error: "Not found" };
  }

  try {
    await updateGuestbookSettings(supabase, guestbookId, theme);
    return { error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "Failed to save";
    return { error: message };
  }
}

export async function uploadOgImageAction(
  guestbookId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const guestbook = await getGuestbook(supabase, guestbookId);
  if (!guestbook || guestbook.user_id !== user.id) {
    return { error: "Not found", url: null };
  }

  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file provided", url: null };

  const ext = file.name.split(".").pop() ?? "png";
  const path = `${user.id}/${guestbookId}/og-image.${ext}`;

  const { error } = await supabase.storage
    .from("logos")
    .upload(path, file, { upsert: true });

  if (error) return { error: error.message, url: null };

  const { data: urlData } = supabase.storage
    .from("logos")
    .getPublicUrl(path);

  const url = `${urlData.publicUrl}?t=${Date.now()}`;
  return { error: null, url };
}

export async function uploadFaviconAction(
  guestbookId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const guestbook = await getGuestbook(supabase, guestbookId);
  if (!guestbook || guestbook.user_id !== user.id) {
    return { error: "Not found", url: null };
  }

  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file provided", url: null };

  const ext = file.name.split(".").pop() ?? "png";
  const path = `${user.id}/${guestbookId}/favicon.${ext}`;

  const { error } = await supabase.storage
    .from("logos")
    .upload(path, file, { upsert: true });

  if (error) return { error: error.message, url: null };

  const { data: urlData } = supabase.storage
    .from("logos")
    .getPublicUrl(path);

  const url = `${urlData.publicUrl}?t=${Date.now()}`;
  return { error: null, url };
}

export async function publishAction(guestbookId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const guestbook = await getGuestbook(supabase, guestbookId);
  if (!guestbook || guestbook.user_id !== user.id) {
    return { error: "Not found", slug: null };
  }

  try {
    let slug = guestbook.slug;

    if (!slug) {
      // First publish — generate and persist a slug
      slug = await generateUniqueSlug(supabase, guestbook.name);
      await updateGuestbookSlug(supabase, guestbookId, slug);
    }

    revalidatePath(`/wall/${slug}`);
    revalidatePath(`/collect/${slug}`);

    return { error: null, slug };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to publish";
    return { error: message, slug: null };
  }
}
