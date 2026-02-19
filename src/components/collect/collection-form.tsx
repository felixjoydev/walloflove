"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { GuestbookSettings } from "@shared/types";

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

  const fontFamily =
    settings.font === "handwriting"
      ? '"Caveat", cursive'
      : settings.font === "mono"
        ? "monospace"
        : "system-ui, sans-serif";

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
          stroke_data: { strokes: [] },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? "Failed to submit");
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
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: settings.background_color, fontFamily }}
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold" style={{ color: settings.text_color }}>
            Thank you!
          </h1>
          <p className="mt-2" style={{ color: settings.text_color, opacity: 0.7 }}>
            Your signature has been submitted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{ backgroundColor: settings.background_color, fontFamily }}
    >
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1
            className="text-2xl font-bold"
            style={{ color: settings.text_color }}
          >
            {settings.collection_title}
          </h1>
          {settings.collection_description && (
            <p
              className="mt-2"
              style={{ color: settings.text_color, opacity: 0.7, fontSize: "14px" }}
            >
              {settings.collection_description}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {/* Drawing canvas placeholder */}
          <div
            className="flex h-32 items-center justify-center rounded-xl border-2 border-dashed"
            style={{
              backgroundColor: settings.canvas_background_color,
              borderColor: settings.text_color,
              opacity: 0.3,
            }}
          >
            <span style={{ color: settings.text_color, fontSize: "14px" }}>
              Drawing canvas (coming soon)
            </span>
          </div>

          <input
            type="text"
            required
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
            style={{ fontFamily }}
          />

          {settings.show_message_field && (
            <textarea
              placeholder="Your message (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={200}
              rows={3}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              style={{ fontFamily }}
            />
          )}

          {settings.show_link_field && (
            <input
              type="url"
              placeholder="Your website (optional)"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              maxLength={500}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              style={{ fontFamily }}
            />
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full py-3 text-base font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: settings.brand_color, fontFamily }}
          >
            {submitting ? "Submitting..." : settings.cta_text}
          </button>
        </form>
      </div>
    </div>
  );
}
