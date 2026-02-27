"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import { toast } from "sonner";
import { GuestbookIcon } from "@/components/guestbook/guestbook-icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ModalPunchHoles, getModalPunchHoleMask } from "@/components/ui/modal-punch-holes";
import { createGuestbookAction } from "@/app/(dashboard)/guestbooks/new/actions";

interface GuestbookItem {
  id: string;
  name: string;
}

export function GuestbookSwitcher({ guestbooks }: { guestbooks: GuestbookItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentId = params.id as string | undefined;
  const current = guestbooks.find((g) => g.id === currentId);

  const VALID_SECTIONS = ["inbox", "preview", "analytics", "settings"];
  const lastSegment = pathname.split("/").pop() ?? "inbox";
  const section = VALID_SECTIONS.includes(lastSegment) ? lastSegment : "inbox";

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
    <>
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
                onClick={() => { setOpen(false); setModalOpen(true); }}
                className="flex w-full items-center gap-[8px] px-[12px] py-[8px] text-left text-body-sm text-text-secondary cursor-pointer hover:bg-bg-subtle"
              >
                <PlusIcon />
                Create new
              </button>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <CreateGuestbookModal onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}

function CreateGuestbookModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    const result = await createGuestbookAction(name.trim());

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success("Guestbook created!");
    onClose();
    window.location.href = `/guestbooks/${result.id}/inbox`;
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg-page/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="relative w-full max-w-[400px] rounded-card shadow-card">
        <Card style={getModalPunchHoleMask()}>
          <div className="h-[48px]" />
          <form onSubmit={handleSubmit} className="flex flex-col gap-[24px] px-[24px] pb-[24px] pt-[8px]">
          <div className="flex flex-col gap-[8px]">
            <h2 className="text-subheading font-semibold text-text-primary">
              Create new guestbook
            </h2>
            <p className="text-body-sm text-text-secondary">
              Give your guestbook a name to get started.
            </p>
          </div>

          <Input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter guestbook name"
          />

          <div className="flex gap-[12px]">
            <Button
              type="button"
              variant="secondary"
              size="small"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="small"
              className="flex-1"
              disabled={loading || !name.trim()}
            >
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
          </form>
        </Card>
        <ModalPunchHoles />
      </div>
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
