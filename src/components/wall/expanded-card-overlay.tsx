"use client";

import { useState, useEffect } from "react";
import type { GuestbookSettings } from "@shared/types";
import { SignatureSvg } from "./signature-svg";
import { darkenColor, getDotColor } from "@/lib/utils/color";

interface Entry {
  id: string;
  name: string;
  message: string | null;
  link: string | null;
  stroke_data: unknown;
  created_at: string;
}

const NOTE_COLOR = "#FFF9C6";
const BORDER_RADIUS = 24;

export function ExpandedCardOverlay({
  entry,
  cardType,
  settings,
  fontFamily,
  onClose,
  signatureImg,
  positioning = "fixed",
}: {
  entry: Entry;
  cardType: "sticky" | "notebook";
  settings: Required<GuestbookSettings>;
  fontFamily: string;
  onClose: () => void;
  signatureImg?: string;
  positioning?: "fixed" | "absolute";
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className={`${positioning} inset-0 z-50 flex items-center justify-center px-[16px]`}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className={`${positioning === "fixed" ? "fixed" : "absolute"} inset-0 bg-black/30`}
        style={{
          transition: "opacity 0.2s ease-out",
          opacity: visible ? 1 : 0,
        }}
      />

      {/* Expanded card */}
      <div
        className="relative w-full"
        style={{
          maxWidth: "380px",
          transition: "opacity 0.2s ease-out, transform 0.2s ease-out",
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(0.95)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {cardType === "sticky" ? (
          <ExpandedStickyCard
            entry={entry}
            fontFamily={fontFamily}
            signatureImg={signatureImg}
          />
        ) : (
          <ExpandedNotebookCard
            entry={entry}
            settings={settings}
            fontFamily={fontFamily}
            signatureImg={signatureImg}
          />
        )}
      </div>
    </div>
  );
}

/* ─── Expanded Sticky Card ─── */

function ExpandedStickyCard({
  entry,
  fontFamily,
  signatureImg,
}: {
  entry: Entry;
  fontFamily: string;
  signatureImg?: string;
}) {
  const strokeObj = entry.stroke_data as Record<string, unknown> | null;
  const cardColor =
    typeof strokeObj?.note_color === "string" ? strokeObj.note_color : NOTE_COLOR;
  const foldLight = darkenColor(cardColor, 0.05);
  const foldDark = darkenColor(cardColor, 0.18);
  const foldStroke = darkenColor(cardColor, 0.1);
  const textColor = darkenColor(cardColor, 0.55);
  const textSecondary = darkenColor(cardColor, 0.4);

  return (
    <div
      className="relative flex flex-col overflow-hidden"
      style={{
        backgroundColor: cardColor,
        borderRadius: `${BORDER_RADIUS}px ${BORDER_RADIUS}px 64px ${BORDER_RADIUS}px`,
        padding: "24px",
        paddingBottom: "28px",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Signature — larger */}
      {signatureImg ? (
        <img
          src={signatureImg}
          alt={`${entry.name}'s signature`}
          className="w-full object-contain"
          style={{ height: "150px" }}
        />
      ) : (
        <SignatureSvg
          strokeData={entry.stroke_data}
          className="w-full h-[150px] [&>svg]:w-full [&>svg]:h-full"
        />
      )}

      {/* Full message — no truncation */}
      {entry.message && (
        <p
          className="text-[13px] mt-[12px] leading-[1.6]"
          style={{ color: textColor, opacity: 0.8, fontFamily }}
        >
          {entry.message}
        </p>
      )}

      {/* Name + link + date */}
      <div className="mt-auto pt-[14px]">
        <span className="flex items-center gap-[4px]">
          <span
            className="text-[13px] font-semibold"
            style={{ color: textColor, fontFamily }}
          >
            {entry.name}
          </span>
          {entry.link && (
            <a
              href={entry.link}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 hover:opacity-70 transition-opacity"
              title={entry.link}
              style={{ color: textSecondary }}
            >
              <ExternalLinkIcon />
            </a>
          )}
        </span>
        <span
          className="text-[11px] block mt-[2px]"
          style={{ color: textSecondary, opacity: 0.7 }}
        >
          {new Date(entry.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>

      {/* Corner fold */}
      <div
        className="absolute bottom-0 right-0 pointer-events-none"
        style={{
          width: "44px",
          height: "44px",
          borderTopLeftRadius: "20px",
          border: "1px solid transparent",
          backgroundImage: `linear-gradient(132deg, ${foldLight} 79.5%, ${foldDark} 85.97%), linear-gradient(135deg, ${foldStroke}00 0%, ${foldStroke} 100%)`,
          backgroundOrigin: "padding-box, border-box",
          backgroundClip: "padding-box, border-box",
          boxShadow:
            "-1px -1px 2px rgba(0,0,0,0.03), -1px -1px 2px rgba(0,0,0,0.02), 2px 3px 4px rgba(0,0,0,0.06)",
        }}
      />
    </div>
  );
}

/* ─── Expanded Notebook Card ─── */

function ExpandedNotebookCard({
  entry,
  settings,
  fontFamily,
  signatureImg,
}: {
  entry: Entry;
  settings: Required<GuestbookSettings>;
  fontFamily: string;
  signatureImg?: string;
}) {
  return (
    <div
      className="flex flex-col relative overflow-hidden"
      style={{
        borderRadius: `${settings.card_border_radius}px`,
        paddingTop: "20px",
        paddingRight: "20px",
        paddingBottom: "20px",
        paddingLeft: "44px",
      }}
    >
      {/* Card background */}
      <div
        className="absolute inset-0 border"
        style={{
          backgroundColor: settings.card_background_color,
          borderColor: settings.card_border_color,
          borderRadius: `${settings.card_border_radius}px`,
          boxShadow:
            "0px 3px 3px 0px rgba(0,0,0,0.06), 0px 1px 1px 0px rgba(0,0,0,0.06), 0px 0px 1px 0px rgba(0,0,0,0.06)",
        }}
      />
      {/* Punch holes */}
      <div className="absolute left-[14px] top-0 bottom-0 flex flex-col items-center justify-evenly pointer-events-none z-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="w-[16px] h-[16px] rounded-full"
            style={{
              backgroundColor: settings.background_color,
              boxShadow: "0 1px 2px 0 rgba(0,0,0,0.15) inset",
            }}
          />
        ))}
      </div>
      {/* Card content */}
      <div className="relative flex flex-col flex-1">
        {/* Signature — larger */}
        {signatureImg ? (
          <div
            className="w-full flex items-center justify-center"
            style={{
              height: "150px",
              backgroundColor: settings.canvas_background_color,
              backgroundImage: `radial-gradient(circle, ${getDotColor(settings.background_color)} 1px, transparent 1px)`,
              backgroundSize: "20px 20px",
              borderRadius: "8px",
            }}
          >
            <img
              src={signatureImg}
              alt={`${entry.name}'s signature`}
              className="max-w-full max-h-full object-contain"
              style={{ height: "130px" }}
            />
          </div>
        ) : (
          <SignatureSvg
            strokeData={entry.stroke_data}
            className="w-full h-[150px] [&>svg]:w-full [&>svg]:h-full"
            style={{
              backgroundColor: settings.canvas_background_color,
              backgroundImage: `radial-gradient(circle, ${getDotColor(settings.background_color)} 1px, transparent 1px)`,
              backgroundSize: "20px 20px",
              borderRadius: "8px",
            }}
          />
        )}

        {/* Full message — no truncation */}
        {entry.message && (
          <p
            className="text-[14px] mt-[14px] leading-[1.6]"
            style={{ color: settings.card_text_color, opacity: 0.7, fontFamily }}
          >
            {entry.message}
          </p>
        )}

        {/* Name + link + date */}
        <div className="flex flex-col gap-[2px] mt-auto pt-[14px]">
          <span className="flex items-center gap-[6px]">
            <span
              className="text-[14px] font-medium"
              style={{ color: settings.card_text_color, fontFamily }}
            >
              {entry.name}
            </span>
            {entry.link && (
              <a
                href={entry.link}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 hover:opacity-70 transition-opacity"
                title={entry.link}
              >
                <ExternalLinkIcon />
              </a>
            )}
          </span>
          <span
            className="text-[11px]"
            style={{ color: settings.card_text_color, opacity: 0.5 }}
          >
            {new Date(entry.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Shared icon ─── */

function ExternalLinkIcon() {
  return (
    <svg
      className="w-[12px] h-[12px]"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 7.667v3.889a1.555 1.555 0 0 1-1.556 1.555H2.556A1.556 1.556 0 0 1 1 11.556V4.667a1.556 1.556 0 0 1 1.556-1.556h3.888" />
      <path d="M9.444 1h3.667v3.667" />
      <path d="M5.667 8.333 13.11 1" />
    </svg>
  );
}
