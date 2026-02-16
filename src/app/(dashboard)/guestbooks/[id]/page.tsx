import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGuestbook } from "@/lib/repositories/guestbook.repo";
import { countEntries } from "@/lib/repositories/entry.repo";
import { EmbedCode } from "@/components/guestbook/embed-code";
import { DeleteGuestbookButton } from "@/components/guestbook/delete-guestbook-button";

export default async function GuestbookDetailPage({
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

  const entryCount = await countEntries(supabase, id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{guestbook.name}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {entryCount} {entryCount === 1 ? "entry" : "entries"}
          </p>
        </div>
        <DeleteGuestbookButton guestbookId={id} />
      </div>

      {/* Navigation tabs */}
      <nav className="mt-6 flex gap-1 border-b border-neutral-200">
        {[
          { label: "Overview", href: `/guestbooks/${id}` },
          { label: "Entries", href: `/guestbooks/${id}/entries` },
          { label: "Theme", href: `/guestbooks/${id}/theme` },
          { label: "Settings", href: `/guestbooks/${id}/settings` },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-neutral-500 hover:text-neutral-900 [&:first-child]:border-neutral-900 [&:first-child]:text-neutral-900"
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {/* Embed code */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Embed code</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Copy this snippet and paste it into your website&apos;s HTML.
        </p>
        <EmbedCode guestbookId={id} />
      </section>
    </div>
  );
}
