import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listGuestbooks } from "@/lib/repositories/guestbook.repo";
import { TopNavbar } from "@/components/ui/top-navbar";
import { IconSidebar } from "@/components/ui/icon-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const guestbooks = await listGuestbooks(supabase, user.id);
  const guestbookList = guestbooks.map((g) => ({ id: g.id, name: g.name }));

  return (
    <div className="flex h-screen flex-col bg-bg-page">
      <TopNavbar guestbooks={guestbookList} userEmail={user.email ?? ""} />
      <IconSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[720px] px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
