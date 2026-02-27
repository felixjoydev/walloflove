import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listGuestbooks } from "@/lib/repositories/guestbook.repo";
import { CreateGuestbookForm } from "@/components/guestbook/create-guestbook-form";

export default async function CreateGuestbookPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const guestbooks = await listGuestbooks(supabase, user.id);
  if (guestbooks.length > 0) {
    redirect(`/guestbooks/${guestbooks[0].id}/inbox`);
  }

  return <CreateGuestbookForm />;
}
