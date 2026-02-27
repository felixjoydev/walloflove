"use client";

import { createContext, useContext } from "react";
import type { GuestbookSettings, DomainVercelStatus, DomainVerificationData } from "@shared/types";

interface GuestbookContextValue {
  id: string;
  name: string;
  slug: string | null;
  settings: Required<GuestbookSettings>;
  customDomain: string | null;
  domainVerified: boolean;
  domainVercelStatus: DomainVercelStatus;
  domainVerificationData: DomainVerificationData | null;
}

const GuestbookContext = createContext<GuestbookContextValue | null>(null);

export function GuestbookProvider({
  guestbook,
  children,
}: {
  guestbook: GuestbookContextValue;
  children: React.ReactNode;
}) {
  return (
    <GuestbookContext.Provider value={guestbook}>
      {children}
    </GuestbookContext.Provider>
  );
}

export function useGuestbookContext() {
  const ctx = useContext(GuestbookContext);
  if (!ctx) throw new Error("useGuestbookContext must be used within GuestbookProvider");
  return ctx;
}
