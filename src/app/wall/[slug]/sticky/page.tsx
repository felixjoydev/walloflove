import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getPublicGuestbookBySlug } from "@/lib/repositories/guestbook.repo";
import { listApprovedEntries } from "@/lib/repositories/entry.repo";
import { mergeSettings } from "@shared/types";
import type { GuestbookSettings } from "@shared/types";
import { WallView } from "@/components/wall/wall-view";

export default async function StickyWallPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guestbook = await getPublicGuestbookBySlug(supabaseAdmin, slug);
  if (!guestbook) notFound();

  const { entries, cursor } = await listApprovedEntries(
    supabaseAdmin,
    guestbook.id,
    null
  );
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
      variant="sticky"
    />
  );
}
