import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getPublicGuestbookBySlug } from "@/lib/repositories/guestbook.repo";
import { mergeSettings } from "@shared/types";
import type { GuestbookSettings } from "@shared/types";
import { CollectionForm } from "@/components/collect/collection-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guestbook = await getPublicGuestbookBySlug(supabaseAdmin, slug);
  if (!guestbook) return {};

  const settings = mergeSettings(
    guestbook.settings as Partial<GuestbookSettings> | null
  );

  const title = settings.seo_title || `${guestbook.name} | Guestbook`;
  const description = settings.seo_description || settings.collection_description || undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(settings.og_image_url ? { images: [{ url: settings.og_image_url }] } : {}),
    },
    icons: settings.favicon_url ? { icon: settings.favicon_url } : undefined,
  };
}

export default async function CollectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guestbook = await getPublicGuestbookBySlug(supabaseAdmin, slug);
  if (!guestbook) notFound();

  const settings = mergeSettings(
    guestbook.settings as Partial<GuestbookSettings> | null
  );

  return (
    <CollectionForm
      guestbook={{
        id: guestbook.id,
        name: guestbook.name,
        slug: guestbook.slug!,
        settings,
      }}
    />
  );
}
