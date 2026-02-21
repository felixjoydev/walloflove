"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import { GuestbookIcon } from "@/components/guestbook/guestbook-icon";

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
        className="flex items-center gap-[10px] cursor-pointer"
      >
        <GuestbookIcon size="sm" />
        <span className="text-body font-medium text-text-primary">
          {current?.name ?? "Select guestbook"}
        </span>
        <ChevronsUpDownIcon />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-[8px] w-[220px] rounded-input border border-border bg-bg-card py-[4px] shadow-card">
          {guestbooks.map((gb) => (
            <button
              key={gb.id}
              onClick={() => switchTo(gb.id)}
              className={`flex w-full items-center gap-[8px] px-[12px] py-[8px] text-left text-body-sm cursor-pointer hover:bg-bg-subtle ${
                gb.id === currentId ? "font-medium text-text-primary" : "text-text-secondary"
              }`}
            >
              {gb.name}
            </button>
          ))}
          <div className="border-t border-border mt-[4px] pt-[4px]">
            <button
              onClick={() => { setOpen(false); router.push("/guestbooks/new"); }}
              className="flex w-full items-center gap-[8px] px-[12px] py-[8px] text-left text-body-sm text-text-secondary cursor-pointer hover:bg-bg-subtle"
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

function ChevronsUpDownIcon() {
  return (
    <svg className="h-[16px] w-[16px] text-text-placeholder" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 6L8 3.5L10.5 6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 10L8 12.5L10.5 10" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="h-[16px] w-[16px] text-text-placeholder" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
