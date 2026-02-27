import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getPublicGuestbookBySlug } from "@/lib/repositories/guestbook.repo";
import { listApprovedEntries } from "@/lib/repositories/entry.repo";
import { mergeSettings } from "@shared/types";
import type { GuestbookSettings } from "@shared/types";
import { WallView } from "@/components/wall/wall-view";

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
  const description = settings.seo_description || settings.wall_description || undefined;

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

export default async function WallPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guestbook = await getPublicGuestbookBySlug(supabaseAdmin, slug);
  if (!guestbook) notFound();

  const { entries, cursor } = await listApprovedEntries(supabaseAdmin, guestbook.id, null);
  const settings = mergeSettings(
    guestbook.settings as Partial<GuestbookSettings> | null
  );

  return (
    <WallView
      guestbook={{
        id: guestbook.id,
        name: guestbook.name,
        slug: guestbook.slug!,
        settings,
      }}
      entries={entries}
      initialCursor={cursor}
      variant={settings.wall_style}
    />
  );
}
