"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GuestbookSettings } from "@shared/types";
import type { DrawingData } from "@shared/types/drawing";
import { WallNavbar } from "./wall-navbar";
import { WallGrid } from "./wall-grid";
import { WallCanvas } from "./wall-canvas";
import { DrawingCanvas } from "@/components/canvas/drawing-canvas";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Entry {
  id: string;
  name: string;
  message: string | null;
  link: string | null;
  stroke_data: unknown;
  created_at: string;
}

interface WallGuestbook {
  id: string;
  name: string;
  slug: string;
  settings: Required<GuestbookSettings>;
}

export function WallView({
  guestbook,
  entries: initialEntries,
  initialCursor,
}: {
  guestbook: WallGuestbook;
  entries: Entry[];
  initialCursor: string | null;
}) {
  const { settings } = guestbook;
  const [viewMode, setViewMode] = useState<"grid" | "canvas">("grid");
  const [showCollect, setShowCollect] = useState(false);

  // Grid view pagination state
  const [gridEntries, setGridEntries] = useState<Entry[]>(initialEntries);
  const [gridCursor, setGridCursor] = useState<string | null>(initialCursor);
  const [loadingMore, setLoadingMore] = useState(false);

  // Canvas view state — all entries loaded
  const [canvasEntries, setCanvasEntries] = useState<Entry[]>([]);
  const [canvasLoading, setCanvasLoading] = useState(false);
  const [canvasLoaded, setCanvasLoaded] = useState(false);

  const fontFamily =
    settings.font === "handwriting"
      ? '"Caveat", cursive'
      : settings.font === "mono"
        ? "monospace"
        : "system-ui, sans-serif";

  // Analytics — page view
  useEffect(() => {
    fetch("/api/v1/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guestbook_id: guestbook.id,
        event_type: "page_view",
        page_type: "wall",
      }),
    }).catch(() => {});
  }, [guestbook.id]);

  // Load more entries for grid view
  const loadMore = useCallback(async () => {
    if (!gridCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      const res = await fetch(
        `${apiUrl}/api/v1/guestbooks/${guestbook.id}/entries?cursor=${gridCursor}`
      );
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setGridEntries((prev) => [...prev, ...data.entries]);
      setGridCursor(data.cursor ?? null);
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoadingMore(false);
    }
  }, [gridCursor, loadingMore, guestbook.id]);

  // Load all entries for canvas view
  const loadAllForCanvas = useCallback(async () => {
    if (canvasLoaded || canvasLoading) return;
    setCanvasLoading(true);

    const allEntries: Entry[] = [];
    let cursor: string | null = null;
    const apiUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

    try {
      // First, use already-fetched grid entries
      allEntries.push(...initialEntries);
      cursor = initialCursor;

      // Then fetch remaining pages
      while (cursor) {
        const res = await fetch(
          `${apiUrl}/api/v1/guestbooks/${guestbook.id}/entries?cursor=${cursor}`
        );
        if (!res.ok) break;
        const data = await res.json();
        allEntries.push(...data.entries);
        cursor = data.cursor ?? null;
      }

      setCanvasEntries(allEntries);
      setCanvasLoaded(true);
    } catch {
      // If partial load, show what we have
      if (allEntries.length > 0) {
        setCanvasEntries(allEntries);
      }
    } finally {
      setCanvasLoading(false);
    }
  }, [canvasLoaded, canvasLoading, initialEntries, initialCursor, guestbook.id]);

  // When switching to canvas, load all entries
  useEffect(() => {
    if (viewMode === "canvas" && !canvasLoaded) {
      loadAllForCanvas();
    }
  }, [viewMode, canvasLoaded, loadAllForCanvas]);

  // Supabase Realtime + polling fallback for approved entries
  const canvasLoadedRef = useRef(canvasLoaded);
  useEffect(() => {
    canvasLoadedRef.current = canvasLoaded;
  }, [canvasLoaded]);

  useEffect(() => {
    const supabase = createClient();
    const apiUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

    // Sync grid/canvas state with fresh API data. Fresh entries replace
    // existing ones (fixes stale stroke_data). Entries not in fresh
    // (e.g. rejected/deleted since last poll) are removed.
    const syncEntries = (fresh: Entry[]) => {
      setGridEntries(fresh);
      if (canvasLoadedRef.current) {
        setCanvasEntries((prev) => {
          const freshMap = new Map(fresh.map((e) => [e.id, e]));
          // Keep canvas entries that aren't in the first page of results
          const extra = prev.filter((e) => !freshMap.has(e.id));
          return [...fresh, ...extra];
        });
      }
    };

    // Poll via the API route — uses supabaseAdmin (service role), so the
    // data format is identical to the server render. This avoids
    // browser-client RLS/TOAST serialization issues with stroke_data.
    let polling = false;
    const poll = async () => {
      if (polling) return;
      polling = true;
      try {
        const res = await fetch(
          `${apiUrl}/api/v1/guestbooks/${guestbook.id}/entries`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data.entries) syncEntries(data.entries as Entry[]);
      } finally {
        polling = false;
      }
    };

    // Realtime — used only as a trigger for an immediate poll (fast path)
    // and for instant DELETE handling. Data always comes from the API route.
    const channel = supabase
      .channel(`wall:${guestbook.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "entries",
          filter: `guestbook_id=eq.${guestbook.id}`,
        },
        (payload) => {
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            poll();
          } else if (payload.eventType === "DELETE") {
            const id = (payload.old as { id: string }).id;
            setGridEntries((prev) => prev.filter((e) => e.id !== id));
            if (canvasLoadedRef.current) {
              setCanvasEntries((prev) => prev.filter((e) => e.id !== id));
            }
          }
        }
      )
      .subscribe();

    const interval = setInterval(poll, 5000);
    poll(); // Run immediately on mount

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [guestbook.id]);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: settings.background_color, fontFamily }}
    >
      {/* Navbar — fixed with fade effect */}
      <div
        className="fixed top-0 left-0 right-0 z-30"
        style={{
          background: `linear-gradient(to bottom, ${settings.background_color} 40%, transparent)`,
        }}
      >
        <WallNavbar
          settings={settings}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>

      {/* Content */}
      {viewMode === "grid" ? (
        <WallGrid
          settings={settings}
          entries={gridEntries}
          fontFamily={fontFamily}
          hasMore={!!gridCursor}
          loadingMore={loadingMore}
          onLoadMore={loadMore}
        />
      ) : (
        <WallCanvas
          settings={settings}
          entries={canvasEntries}
          fontFamily={fontFamily}
          loading={canvasLoading}
        />
      )}

      {/* Floating CTA — fixed at bottom, no gradient bar */}
      <button
        onClick={() => setShowCollect(true)}
        className="fixed bottom-[32px] left-1/2 -translate-x-1/2 z-30 inline-flex items-center justify-center px-[24px] py-[12px] font-semibold text-[14px] shadow-card cursor-pointer hover:opacity-90 transition-opacity"
        style={{
          backgroundColor: settings.brand_color,
          color: settings.button_text_color,
          borderRadius: `${settings.button_border_radius}px`,
          fontFamily,
        }}
      >
        {settings.cta_text || "Sign the Guestbook"}
      </button>

      {/* Collection modal */}
      {showCollect && (
        <CollectModal
          guestbook={guestbook}
          settings={settings}
          fontFamily={fontFamily}
          onClose={() => setShowCollect(false)}
        />
      )}
    </div>
  );
}

/* ─── Collection Modal ─── */

function CollectModal({
  guestbook,
  settings,
  fontFamily,
  onClose,
}: {
  guestbook: { id: string; slug: string };
  settings: Required<GuestbookSettings>;
  fontFamily: string;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [drawingData, setDrawingData] = useState<DrawingData | null>(null);

  const handleDrawingChange = useCallback((data: DrawingData) => {
    setDrawingData(data);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      const res = await fetch(`${apiUrl}/api/v1/guestbooks/${guestbook.id}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          message: message.trim() || undefined,
          link: link.trim() || undefined,
          stroke_data: drawingData ?? { version: 1, width: 400, height: 250, strokes: [] },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        const msg = typeof data.error === "string" ? data.error : "Failed to submit";
        throw new Error(msg);
      }

      setSubmitted(true);
      toast.success("Thank you for signing!");

      fetch("/api/v1/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestbook_id: guestbook.id,
          event_type: "submission",
          page_type: "wall",
        }),
      }).catch(() => {});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-[16px]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Modal content */}
      <div
        className="relative w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily }}
      >
        <Card>
          {submitted ? (
            <div className="p-[24px] text-center">
              <h2 className="text-subheading font-semibold text-text-primary">
                Thank you!
              </h2>
              <p className="mt-2 text-body font-medium text-text-secondary">
                Your signature has been submitted.
              </p>
              <div className="mt-[16px]">
                <button
                  onClick={onClose}
                  className="flex items-center justify-center font-semibold h-[44px] w-full rounded-input transition-opacity hover:opacity-90 cursor-pointer"
                  style={{
                    backgroundColor: settings.brand_color,
                    color: settings.button_text_color,
                    borderRadius: `${settings.button_border_radius}px`,
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-[16px] p-[24px]">
              {/* Logo + title + description inside card */}
              <div className="text-center flex flex-col items-center gap-[4px]">
                {settings.logo_url && (
                  <img
                    src={settings.logo_url}
                    alt="Logo"
                    className="w-[56px] h-[42px] object-contain"
                  />
                )}
                <h2
                  className="text-[18px] font-semibold"
                  style={{ color: settings.text_color }}
                >
                  {settings.collection_title}
                </h2>
                {settings.collection_description && (
                  <p
                    className="text-[14px] font-medium"
                    style={{ color: settings.text_color, opacity: 0.7 }}
                  >
                    {settings.collection_description}
                  </p>
                )}
              </div>

              <DrawingCanvas onChange={handleDrawingChange} brandColor={settings.brand_color} />

              <Input
                type="text"
                required
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
              />

              {settings.show_message_field && (
                <textarea
                  placeholder="Your message (optional)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={200}
                  rows={3}
                  className="w-full rounded-input border border-border bg-bg-input px-[10px] py-[10px] text-body font-medium text-text-primary placeholder:text-text-placeholder focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors resize-none"
                />
              )}

              {settings.show_link_field && (
                <Input
                  type="url"
                  placeholder="Your website (optional)"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  maxLength={500}
                />
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center font-semibold h-[44px] w-full rounded-input transition-opacity hover:opacity-90 cursor-pointer disabled:opacity-50"
                style={{
                  backgroundColor: settings.brand_color,
                  color: settings.button_text_color,
                  borderRadius: `${settings.button_border_radius}px`,
                }}
              >
                {submitting ? "Submitting..." : settings.cta_text}
              </button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
