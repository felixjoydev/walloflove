import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listGuestbooks } from "@/lib/repositories/guestbook.repo";
import { ScratchReveal } from "@/components/billing/scratch-reveal";

export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const guestbooks = await listGuestbooks(supabase, user.id);
  if (guestbooks.length > 0) {
    redirect(`/guestbooks/${guestbooks[0].id}/inbox`);
  }

  return <ScratchReveal />;
}
