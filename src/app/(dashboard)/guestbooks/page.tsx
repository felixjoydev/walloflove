import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listGuestbooks } from "@/lib/repositories/guestbook.repo";
import { GuestbookCard } from "@/components/guestbook/guestbook-card";

export default async function GuestbooksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const guestbooks = await listGuestbooks(supabase, user.id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Guestbooks</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage your embeddable guestbook widgets.
          </p>
        </div>
        <Link
          href="/guestbooks/new"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          New guestbook
        </Link>
      </div>

      {guestbooks.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-lg font-medium">No guestbooks yet</p>
          <p className="mt-1 text-sm text-neutral-500">
            Create your first guestbook to get started.
          </p>
          <Link
            href="/guestbooks/new"
            className="mt-4 inline-block rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Create your first guestbook
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guestbooks.map((gb) => (
            <GuestbookCard
              key={gb.id}
              id={gb.id}
              name={gb.name}
              entryCount={
                (gb.entries as unknown as { count: number }[])?.[0]?.count ?? 0
              }
              createdAt={gb.created_at}
            />
          ))}
        </div>
      )}
    </div>
  );
}
