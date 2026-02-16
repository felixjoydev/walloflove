import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGuestbook } from "@/lib/repositories/guestbook.repo";
import { listAllEntries } from "@/lib/repositories/entry.repo";
import { EntriesTable } from "./entries-table";

export default async function EntriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const guestbook = await getGuestbook(supabase, id);
  if (!guestbook || guestbook.user_id !== user.id) notFound();

  const entries = await listAllEntries(supabase, id);

  return (
    <div>
      <h1 className="text-2xl font-bold">Entries</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Moderate entries for {guestbook.name}.
      </p>

      <EntriesTable guestbookId={id} entries={entries} />
    </div>
  );
}
