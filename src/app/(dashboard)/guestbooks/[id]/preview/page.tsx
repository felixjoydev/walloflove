import { createClient } from "@/lib/supabase/server";
import { listApprovedEntries } from "@/lib/repositories/entry.repo";
import { PreviewEditor } from "@/components/preview/preview-editor";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { entries } = await listApprovedEntries(supabase, id, null);

  return <PreviewEditor guestbookId={id} entries={entries} />;
}
