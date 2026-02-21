"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { GuestbookSettings } from "@shared/types";
import type { DrawingData } from "@shared/types/drawing";
import { DrawingCanvas } from "@/components/canvas/drawing-canvas";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface CollectionGuestbook {
  id: string;
  name: string;
  slug: string;
  settings: Required<GuestbookSettings>;
}

export function CollectionForm({ guestbook }: { guestbook: CollectionGuestbook }) {
  const { settings } = guestbook;
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [drawingData, setDrawingData] = useState<DrawingData | null>(null);

  const handleDrawingChange = useCallback((data: DrawingData) => {
    setDrawingData(data);
  }, []);

  useEffect(() => {
    fetch("/api/v1/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guestbook_id: guestbook.id,
        event_type: "page_view",
        page_type: "collection",
      }),
    }).catch(() => {});
  }, [guestbook.id]);

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

      // Track submission
      fetch("/api/v1/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestbook_id: guestbook.id,
          event_type: "submission",
          page_type: "collection",
        }),
      }).catch(() => {});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-page px-4">
        <div className="text-center">
          <h1 className="text-subheading font-semibold text-text-primary">
            Thank you!
          </h1>
          <p className="mt-2 text-body font-medium text-text-secondary">
            Your signature has been submitted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-page px-4 py-12">
      <div className="w-full max-w-md flex flex-col gap-[24px]">
        {/* Logo + Heading + description — outside the card */}
        <div className="text-center flex flex-col items-center gap-[8px]">
          <img src={settings.logo_url || "/logo.svg"} alt="Logo" className="w-[56px] h-[42px] object-contain" />
          <h1 className="text-subheading font-semibold text-text-primary">
            {settings.collection_title}
          </h1>
          {settings.collection_description && (
            <p className="text-body-sm font-medium text-text-secondary">
              {settings.collection_description}
            </p>
          )}
        </div>

        {/* Card: editor + form fields + button */}
        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-[16px] p-[24px]">
            <DrawingCanvas
              onChange={handleDrawingChange}
              brandColor={settings.brand_color}
            />

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
              className="flex items-center justify-center font-semibold h-[44px] w-full transition-opacity hover:opacity-90 cursor-pointer disabled:opacity-50"
              style={{
                backgroundColor: settings.brand_color,
                color: settings.button_text_color,
                borderRadius: `${settings.button_border_radius}px`,
              }}
            >
              {submitting ? "Submitting..." : settings.cta_text}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
