"use client";

import { useEffect, useRef } from "react";
import { BillingCard } from "@/components/billing/billing-card";

/*
 * Plan selection UI removed for free launch period.
 * When ready to introduce paid plans, restore the plan grid and BillingActions
 * from git history (see commit before this change) or reference the plan config
 * at src/lib/stripe/config.ts and BillingActions at
 * src/app/(dashboard)/billing/billing-actions.tsx.
 */

export function BillingModal({ onClose }: { onClose: () => void }) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg-page/70 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="w-full max-w-[620px] px-[16px]">
        <BillingCard />
      </div>
    </div>
  );
}
