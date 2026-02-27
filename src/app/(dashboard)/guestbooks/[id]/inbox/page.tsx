import { createClient } from "@/lib/supabase/server";
import { listAllEntries } from "@/lib/repositories/entry.repo";
import { InboxView } from "@/components/inbox/inbox-view";

export default async function InboxPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const entries = await listAllEntries(supabase, id);

  return <InboxView guestbookId={id} entries={entries} />;
}
