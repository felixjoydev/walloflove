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
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4">
      <Link href="/guestbooks" className="text-lg font-bold">
        SignBoard
      </Link>
      <GuestbookSwitcher guestbooks={guestbooks} />
      <ProfileDropdown email={userEmail} />
    </header>
  );
}
