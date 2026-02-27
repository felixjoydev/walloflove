"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { GuestbookSettings } from "@shared/types";
import type { DrawingData } from "@shared/types/drawing";
import { DrawingCanvas } from "@/components/canvas/drawing-canvas";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { darkenColor } from "@/lib/utils/color";

interface CollectionGuestbook {
  id: string;
  name: string;
  slug: string;
  settings: Required<GuestbookSettings>;
}

const STICKY_COLORS = [
  "#F5F5F5",
  "#FFD0C8",
  "#FFE5CB",
  "#FFF9C6",
  "#D1F6D7",
  "#CBE9FF",
  "#E5D7FF",
  "#FFCBE9",
] as const;

export function CollectionForm({ guestbook }: { guestbook: CollectionGuestbook }) {
  const { settings } = guestbook;
  const isSticky = settings.wall_style === "sticky";
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [drawingData, setDrawingData] = useState<DrawingData | null>(null);
  const [selectedColor, setSelectedColor] = useState("#FFF9C6");

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

    const baseStrokeData = drawingData ?? { version: 1, width: 400, height: 250, strokes: [] };

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
          stroke_data: {
            ...baseStrokeData,
            ...(isSticky ? { note_color: selectedColor } : {}),
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        const msg = typeof data.error === "string" ? data.error : "Failed to submit";
        throw new Error(msg);
      }

      setSubmitted(true);
      toast.success(
        settings.moderation_mode === "manual_approve"
          ? "Submitted! Awaiting approval."
          : "Your signature is live!"
      );

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
            {settings.moderation_mode === "manual_approve"
              ? "Your scribble has been received! It\u2019ll appear on the wall once the owner gives it a thumbs up."
              : "Your signature is live on the wall!"}
          </p>
        </div>
      </div>
    );
  }

  const formContent = (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[16px] p-[24px]">
      {/* Sticky color picker */}
      {isSticky && (
        <div className="flex items-center gap-[8px] justify-center">
          {STICKY_COLORS.map((color) => {
            const isSelected = selectedColor === color;
            const foldLight = darkenColor(color, 0.05);
            const foldDark = darkenColor(color, 0.18);
            const foldStroke = darkenColor(color, 0.10);
            return (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className="relative shrink-0 cursor-pointer transition-all overflow-hidden"
                style={{
                  width: "28px",
                  height: "28px",
                  backgroundColor: color,
                  borderRadius: "5px 5px 12px 5px",
                  outline: isSelected ? `2px solid ${settings.brand_color}` : "none",
                  outlineOffset: "2px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                }}
              >
                <div
                  className="absolute bottom-0 right-0 pointer-events-none"
                  style={{
                    width: "8px",
                    height: "8px",
                    borderTopLeftRadius: "4px",
                    border: "0.5px solid transparent",
                    backgroundImage: `linear-gradient(132deg, ${foldLight} 79.5%, ${foldDark} 85.97%), linear-gradient(135deg, ${foldStroke}00 0%, ${foldStroke} 100%)`,
                    backgroundOrigin: "padding-box, border-box",
                    backgroundClip: "padding-box, border-box",
                  }}
                />
              </button>
            );
          })}
        </div>
      )}

      <DrawingCanvas
        onChange={handleDrawingChange}
        brandColor={settings.brand_color}
        {...(isSticky ? {
          backgroundColor: selectedColor,
          showDotGrid: false,
          showInsetShadow: false,
          drawerColor: darkenColor(selectedColor, 0.05),
        } : {})}
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
  );

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

        {/* Card: always white, sticky color only affects the canvas */}
        <Card>{formContent}</Card>
      </div>
    </div>
  );
}
