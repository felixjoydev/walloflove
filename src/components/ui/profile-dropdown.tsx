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
        className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-300"
        title={email}
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
          <div className="border-b border-neutral-100 px-3 py-2">
            <p className="truncate text-sm font-medium text-neutral-900">{email}</p>
          </div>
          <Link
            href="/billing"
            onClick={() => setOpen(false)}
            className="flex w-full items-center px-3 py-2 text-left text-sm text-neutral-600 hover:bg-neutral-50"
          >
            Billing
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center px-3 py-2 text-left text-sm text-neutral-600 hover:bg-neutral-50"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
