"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";

interface GuestbookItem {
  id: string;
  name: string;
}

export function GuestbookSwitcher({ guestbooks }: { guestbooks: GuestbookItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentId = params.id as string | undefined;
  const current = guestbooks.find((g) => g.id === currentId);

  // Get current section from pathname (inbox, preview, analytics, settings)
  const section = pathname.split("/").pop() ?? "inbox";

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function switchTo(id: string) {
    setOpen(false);
    router.push(`/guestbooks/${id}/${section}`);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-neutral-50"
      >
        <span className="max-w-[180px] truncate">{current?.name ?? "Select guestbook"}</span>
        <ChevronIcon />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
          {guestbooks.map((gb) => (
            <button
              key={gb.id}
              onClick={() => switchTo(gb.id)}
              className={`flex w-full items-center px-3 py-2 text-left text-sm hover:bg-neutral-50 ${
                gb.id === currentId ? "font-medium text-neutral-900" : "text-neutral-600"
              }`}
            >
              {gb.name}
            </button>
          ))}
          <div className="border-t border-neutral-100 mt-1 pt-1">
            <button
              onClick={() => { setOpen(false); router.push("/guestbooks/new"); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-500 hover:bg-neutral-50"
            >
              <PlusIcon />
              Create new
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
