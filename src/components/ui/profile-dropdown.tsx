"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function ProfileDropdown({ email }: { email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = email.substring(0, 2).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-bg-subtle text-body-sm font-medium text-text-secondary cursor-pointer hover:bg-bg-input"
        title={email}
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-[8px] w-[220px] rounded-input border border-border bg-bg-card py-[4px] shadow-card">
          <div className="border-b border-border px-[12px] py-[8px]">
            <p className="truncate text-body-sm font-medium text-text-primary">{email}</p>
          </div>
          <Link
            href="/billing"
            onClick={() => setOpen(false)}
            className="flex w-full items-center px-[12px] py-[8px] text-left text-body-sm text-text-secondary hover:bg-bg-subtle"
          >
            Billing
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center px-[12px] py-[8px] text-left text-body-sm text-text-secondary cursor-pointer hover:bg-bg-subtle"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
