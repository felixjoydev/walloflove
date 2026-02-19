import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getPublicGuestbookBySlug } from "@/lib/repositories/guestbook.repo";
import { mergeSettings } from "@shared/types";
import type { GuestbookSettings } from "@shared/types";
import { CollectionForm } from "@/components/collect/collection-form";

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
