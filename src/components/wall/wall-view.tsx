"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { GuestbookSettings } from "@shared/types";

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
  entries,
}: {
  guestbook: WallGuestbook;
  entries: Entry[];
}) {
  const { settings } = guestbook;

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
        page_type: "wall",
      }),
    }).catch(() => {});
  }, [guestbook.id]);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: settings.background_color, fontFamily }}
    >
      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Header */}
        <div className="text-center">
          <h1
            className="text-3xl font-bold"
            style={{ color: settings.text_color }}
          >
            {settings.wall_title}
          </h1>
          {settings.wall_description && (
            <p
              className="mt-2 text-lg"
              style={{ color: settings.text_color, opacity: 0.7 }}
            >
              {settings.wall_description}
            </p>
          )}
        </div>

        {/* Entries grid */}
        {entries.length > 0 ? (
          <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="mb-4 break-inside-avoid"
                style={{
                  backgroundColor: settings.card_background_color,
                  borderRadius: `${settings.card_border_radius}px`,
                  padding: "16px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
              >
                {/* Signature placeholder */}
                <div
                  style={{
                    backgroundColor: settings.canvas_background_color,
                    borderRadius: "8px",
                    height: "80px",
                  }}
                />
                <p
                  className="mt-2 font-semibold"
                  style={{ color: settings.text_color, fontSize: "15px" }}
                >
                  {entry.name}
                </p>
                {entry.message && (
                  <p
                    className="mt-1"
                    style={{
                      color: settings.text_color,
                      opacity: 0.7,
                      fontSize: "13px",
                    }}
                  >
                    {entry.message}
                  </p>
                )}
                {entry.link && (
                  <a
                    href={entry.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-xs hover:underline"
                    style={{ color: settings.brand_color }}
                  >
                    {entry.link}
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-16 text-center">
            <p style={{ color: settings.text_color, opacity: 0.5, fontSize: "14px" }}>
              No entries yet. Be the first to sign!
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 text-center">
          <Link
            href={`/collect/${guestbook.slug}`}
            className="inline-block rounded-full px-8 py-3 text-base font-semibold text-white"
            style={{ backgroundColor: settings.brand_color, fontFamily }}
          >
            {settings.cta_text}
          </Link>
        </div>
      </div>
    </div>
  );
}
