import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGuestbook } from "@/lib/repositories/guestbook.repo";
import { GuestbookProvider } from "@/components/providers/guestbook-provider";
import { mergeSettings } from "@shared/types";
import type { GuestbookSettings, DomainVercelStatus, DomainVerificationData } from "@shared/types";

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
          (guestbook.draft_settings ?? guestbook.settings) as Partial<GuestbookSettings> | null
        ),
        publishedSettings: mergeSettings(
          guestbook.settings as Partial<GuestbookSettings> | null
        ),
        customDomain: guestbook.custom_domain,
        domainVerified: guestbook.domain_verified,
        domainVercelStatus: guestbook.domain_vercel_status as DomainVercelStatus,
        domainVerificationData: guestbook.domain_verification_data as DomainVerificationData | null,
      }}
    >
      {children}
    </GuestbookProvider>
  );
}
