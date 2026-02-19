import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGuestbook } from "@/lib/repositories/guestbook.repo";
import { GuestbookProvider } from "@/components/providers/guestbook-provider";
import { mergeSettings } from "@shared/types";
import type { GuestbookSettings } from "@shared/types";

export default async function GuestbookLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const guestbook = await getGuestbook(supabase, id);
  if (!guestbook || guestbook.user_id !== user?.id) notFound();

  return (
    <GuestbookProvider
      guestbook={{
        id: guestbook.id,
        name: guestbook.name,
        slug: guestbook.slug,
        settings: mergeSettings(
          guestbook.settings as Partial<GuestbookSettings> | null
        ),
      }}
    >
      {children}
    </GuestbookProvider>
  );
}
