import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGuestbook } from "@/lib/repositories/guestbook.repo";
import { mergeSettings } from "@shared/types";
import type { GuestbookSettings } from "@shared/types";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage({
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

  const settings = mergeSettings(
    guestbook.settings as Partial<GuestbookSettings> | null
  );

  return (
    <div>
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Configure behavior for {guestbook.name}.
      </p>

      <SettingsForm
        guestbookId={id}
        guestbookName={guestbook.name}
        initialSettings={settings}
      />
    </div>
  );
}
