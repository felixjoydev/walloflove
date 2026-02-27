import Link from "next/link";
import { GuestbookSwitcher } from "./guestbook-switcher";
import { ProfileDropdown } from "./profile-dropdown";

interface GuestbookItem {
  id: string;
  name: string;
}

export function TopNavbar({
  guestbooks,
  userEmail,
}: {
  guestbooks: GuestbookItem[];
  userEmail: string;
}) {
  return (
    <header className="shrink-0 bg-bg-page">
      <div className="mx-auto flex h-[72px] max-w-[720px] items-center justify-between px-6">
        <div className="flex items-center gap-[16px]">
          <Link href="/guestbooks" className="shrink-0">
            <img src="/logo.svg" alt="Guestbook" className="h-[40px] w-[52px]" />
          </Link>
          <GuestbookSwitcher guestbooks={guestbooks} />
        </div>
        <ProfileDropdown email={userEmail} />
      </div>
    </header>
  );
}
