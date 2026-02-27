"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

const navItems = [
  { icon: InboxIcon, tooltip: "Inbox", segment: "inbox" },
  { icon: GlobeIcon, tooltip: "Publish", segment: "preview" },
  { icon: AnalyticsIcon, tooltip: "Analytics", segment: "analytics" },
  { icon: SettingsIcon, tooltip: "Settings", segment: "settings" },
];

export function IconSidebar() {
  const params = useParams();
  const pathname = usePathname();
  const guestbookId = params.id as string | undefined;

  if (!guestbookId) return null;

  return (
    <>
      {/* Desktop: fixed vertical sidebar */}
      <aside
        className="hidden lg:block fixed top-1/2 -translate-y-1/2 z-10"
        style={{ left: "max(16px, calc(50% - 488px))" }}
      >
        <nav className="flex flex-col items-center gap-[8px] rounded-card border border-border bg-bg-nav p-[8px] shadow-card">
          {navItems.map((item) => {
            const href = `/guestbooks/${guestbookId}/${item.segment}`;
            const isActive = pathname.includes(`/${item.segment}`);

            return (
              <Link
                key={item.segment}
                href={href}
                title={item.tooltip}
                className={`flex h-[40px] w-[40px] items-center justify-center rounded-icon transition-colors ${
                  isActive
                    ? "bg-accent text-white"
                    : "text-white hover:bg-white/10"
                }`}
              >
                <item.icon />
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile: fixed horizontal bottom bar */}
      <nav className="lg:hidden fixed bottom-0 left-1/2 -translate-x-1/2 mb-[12px] z-30 flex items-center gap-[8px] rounded-card border border-border bg-bg-nav p-[8px] shadow-card">
        {navItems.map((item) => {
          const href = `/guestbooks/${guestbookId}/${item.segment}`;
          const isActive = pathname.includes(`/${item.segment}`);

          return (
            <Link
              key={item.segment}
              href={href}
              title={item.tooltip}
              className={`flex h-[40px] w-[40px] items-center justify-center rounded-icon transition-colors ${
                isActive
                  ? "bg-accent text-white"
                  : "text-white hover:bg-white/10"
              }`}
            >
              <item.icon />
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function InboxIcon() {
  return (
    <svg className="h-[22px] w-[22px]" viewBox="0 0 22 18" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M6.23969 0C5.68156 0.000296295 5.13458 0.156283 4.66025 0.450419C4.18639 0.744269 3.8038 1.16436 3.55542 1.66354L3.55469 1.665L0.115048 8.5343C0.0762458 8.6079 0.046354 8.68693 0.0268083 8.76995C0.00712682 8.85291 -0.00152303 8.93693 0.000218535 9.02009V15C0.000218535 16.6569 1.34337 18 3.00022 18H19.0002C20.6571 18 22.0002 16.6569 22.0002 15V9.02009C22.002 8.93698 21.9933 8.853 21.9737 8.77009C21.9541 8.68701 21.9242 8.60793 21.8854 8.53428L18.4457 1.665L18.4451 1.66368C18.1967 1.16444 17.8141 0.744298 17.3402 0.450419C16.8659 0.156282 16.3189 0.000296295 15.7607 0H6.23969ZM19.3811 8L16.656 2.55773L16.6547 2.555C16.5719 2.38839 16.4443 2.24818 16.2862 2.15014C16.1281 2.05213 15.9459 2.00013 15.7599 2H6.24056C6.05458 2.00013 5.87233 2.05213 5.71427 2.15014C5.55616 2.24819 5.42854 2.38839 5.34575 2.555L5.34439 2.55773L2.6193 8H7.00022C7.33457 8 7.6468 8.1671 7.83227 8.4453L9.5354 11H12.465L14.1682 8.4453C14.3536 8.1671 14.6659 8 15.0002 8H19.3811Z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg className="h-[22px] w-[22px]" viewBox="0 0 22 22" fill="currentColor">
      <path d="M8.30138 0.296313C3.81992 1.42068 0.425446 5.28099 3.69329e-05 9.99676H5.02019C5.26223 6.52346 6.3984 3.18396 8.30138 0.296313Z" />
      <path d="M0 12.0032C0.425259 16.7193 3.81996 20.5799 8.30171 21.7042C6.39853 18.8164 5.26224 15.4767 5.02019 12.0032H0Z" />
      <path d="M13.6983 21.7042C18.18 20.5799 21.5747 16.7193 22 12.0032H16.9798C16.7378 15.4767 15.6015 18.8164 13.6983 21.7042Z" />
      <path d="M22 9.99676C21.5746 5.28099 18.1801 1.42068 13.6986 0.296313C15.6016 3.18396 16.7378 6.52346 16.9798 9.99676H22Z" />
      <path d="M11 22C8.70015 19.1445 7.31683 15.6593 7.03377 12.0032H14.9662C14.6832 15.6593 13.2998 19.1445 11 22Z" />
      <path d="M11 0C8.70015 2.85547 7.31683 6.3407 7.03377 9.99676H14.9662C14.6832 6.3407 13.2998 2.85547 11 0Z" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg className="h-[24px] w-[24px]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 4.35294C9 3.05345 9.89543 2 11 2H13C14.1046 2 15 3.05345 15 4.35294V19.6471C15 20.9466 14.1046 22 13 22H11C9.89543 22 9 20.9466 9 19.6471V4.35294Z" />
      <path d="M17 9.05882C17 7.75933 17.8954 6.70588 19 6.70588H21C22.1046 6.70588 23 7.75933 23 9.05882V19.6471C23 20.9466 22.1046 22 21 22H19C17.8954 22 17 20.9466 17 19.6471V9.05882Z" />
      <path d="M3 12C1.89543 12 1 13.0534 1 14.3529V19.6471C1 20.9466 1.89543 22 3 22H5C6.10457 22 7 20.9466 7 19.6471V14.3529C7 13.0534 6.10457 12 5 12H3Z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="h-[22px] w-[22px]" viewBox="0 0 22 22" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M13.5051 1.17649C12.2034 -0.392164 9.79662 -0.392164 8.49491 1.17649L7.87457 1.92404C7.60994 2.24295 7.20496 2.41069 6.79234 2.37232L5.8251 2.28236C3.79544 2.0936 2.0936 3.79544 2.28236 5.8251L2.37232 6.79234C2.41069 7.20496 2.24295 7.60994 1.92404 7.87457L1.17649 8.49491C-0.392164 9.79662 -0.392164 12.2034 1.17649 13.5051L1.92404 14.1254C2.24295 14.3901 2.41069 14.795 2.37232 15.2077L2.28236 16.1749C2.0936 18.2046 3.79544 19.9064 5.8251 19.7176L6.79234 19.6277C7.20496 19.5893 7.60994 19.7571 7.87457 20.076L8.49491 20.8235C9.79662 22.3922 12.2034 22.3922 13.5051 20.8235L14.1254 20.076C14.3901 19.7571 14.795 19.5893 15.2077 19.6277L16.1749 19.7176C18.2046 19.9064 19.9064 18.2046 19.7176 16.1749L19.6277 15.2077C19.5893 14.795 19.7571 14.3901 20.076 14.1254L20.8235 13.5051C22.3922 12.2034 22.3922 9.79662 20.8235 8.49491L20.076 7.87457C19.7571 7.60994 19.5893 7.20496 19.6277 6.79234L19.7176 5.8251C19.9064 3.79544 18.2046 2.0936 16.1749 2.28236L15.2077 2.37232C14.795 2.41069 14.3901 2.24295 14.1254 1.92404L13.5051 1.17649ZM11 14C12.6569 14 14 12.6569 14 11C14 9.34315 12.6569 8 11 8C9.34315 8 8 9.34315 8 11C8 12.6569 9.34315 14 11 14Z" />
    </svg>
  );
}
