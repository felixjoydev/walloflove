"use client";

import { createContext, useContext, useState, useMemo, useCallback } from "react";
import type { GuestbookSettings, DomainVercelStatus, DomainVerificationData } from "@shared/types";

interface GuestbookData {
  id: string;
  name: string;
  slug: string | null;
  settings: Required<GuestbookSettings>;
  publishedSettings: Required<GuestbookSettings>;
  customDomain: string | null;
  domainVerified: boolean;
  domainVercelStatus: DomainVercelStatus;
  domainVerificationData: DomainVerificationData | null;
}

interface GuestbookContextValue extends GuestbookData {
  updateSettings: (settings: Required<GuestbookSettings>) => void;
  publishedSettings: Required<GuestbookSettings>;
  markPublished: () => void;
}

const GuestbookContext = createContext<GuestbookContextValue | null>(null);

export function GuestbookProvider({
  guestbook,
  children,
}: {
  guestbook: GuestbookData;
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState(guestbook.settings);
  const [publishedSettings, setPublishedSettings] = useState(guestbook.publishedSettings);

  const updateSettings = useCallback((s: Required<GuestbookSettings>) => {
    setSettings(s);
  }, []);

  const markPublished = useCallback(() => {
    setSettings((current) => {
      setPublishedSettings(current);
      return current;
    });
  }, []);

  const value = useMemo<GuestbookContextValue>(() => ({
    ...guestbook,
    settings,
    updateSettings,
    publishedSettings,
    markPublished,
  }), [guestbook, settings, updateSettings, publishedSettings, markPublished]);

  return (
    <GuestbookContext.Provider value={value}>
      {children}
    </GuestbookContext.Provider>
  );
}

export function useGuestbookContext() {
  const ctx = useContext(GuestbookContext);
  if (!ctx) throw new Error("useGuestbookContext must be used within GuestbookProvider");
  return ctx;
}
