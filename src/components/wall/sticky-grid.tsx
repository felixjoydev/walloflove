import type { GuestbookSettings } from "@shared/types";
import { SignatureSvg } from "./signature-svg";

interface Entry {
  id: string;
  name: string;
  message: string | null;
  link: string | null;
  stroke_data: unknown;
  created_at: string;
}

/** Darken a hex color by a given amount (0–1) */
function darkenColor(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  const r = Math.max(
    0,
    parseInt(clean.slice(0, 2), 16) - Math.round(255 * amount)
  );
  const g = Math.max(
    0,
    parseInt(clean.slice(2, 4), 16) - Math.round(255 * amount)
  );
  const b = Math.max(
    0,
    parseInt(clean.slice(4, 6), 16) - Math.round(255 * amount)
  );
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/* Sticky note yellow — all fold values derive from this */
const NOTE_COLOR = "#FFF9C6";
const NOTE_TEXT = "#5D4E37";
const NOTE_TEXT_SECONDARY = "#8B7355";
const BORDER_RADIUS = 24;

export function StickyGrid({
  settings,
  entries,
  fontFamily,
  hasMore,
  loadingMore,
  onLoadMore,
}: {
  settings: Required<GuestbookSettings>;
  entries: Entry[];
  fontFamily: string;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}) {
  if (entries.length === 0) {
    return (
      <div className="mx-auto max-w-[780px] px-[16px] pt-[72px] pb-[120px]">
        <div className="text-center py-[64px]">
          <p
            className="text-[14px]"
            style={{ color: settings.text_color, opacity: 0.5 }}
          >
            No entries yet. Be the first to sign!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[780px] px-[16px] pb-[200px]">
      {/* Title */}
      <div className="pt-[72px]">
        <h1
          className="text-[24px] font-bold"
          style={{ color: settings.text_color, fontFamily }}
        >
          {settings.wall_title}
        </h1>
      </div>
      {/* Description */}
      {settings.wall_description && (
        <p
          className="text-[14px] mt-[4px]"
          style={{ color: settings.text_color, opacity: 0.7, fontFamily }}
        >
          {settings.wall_description}
        </p>
      )}

      {/* Sticky note grid */}
      <div className="mt-[24px] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[24px]">
        {entries.map((entry) => (
          <StickyNoteCard
            key={entry.id}
            entry={entry}
            settings={settings}
            fontFamily={fontFamily}
          />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="mt-[24px] flex justify-center">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="px-[24px] py-[10px] text-[14px] font-medium rounded-input border border-border bg-bg-card shadow-card-sm cursor-pointer hover:bg-bg-subtle transition-colors disabled:opacity-50"
            style={{ color: settings.text_color }}
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Sticky Note Card ─── */

function StickyNoteCard({
  entry,
  settings,
  fontFamily,
}: {
  entry: Entry;
  settings: Required<GuestbookSettings>;
  fontFamily: string;
}) {
  // Read per-entry note color (stored in stroke_data), fallback to default yellow
  const strokeObj = entry.stroke_data as Record<string, unknown> | null;
  const cardColor = typeof strokeObj?.note_color === "string" ? strokeObj.note_color : NOTE_COLOR;

  // Derive all colors from card color
  const foldLight = darkenColor(cardColor, 0.05);
  const foldDark = darkenColor(cardColor, 0.18);
  const foldStroke = darkenColor(cardColor, 0.10);
  const textColor = darkenColor(cardColor, 0.55);
  const textSecondary = darkenColor(cardColor, 0.40);

  return (
    <div
      className="relative flex flex-col h-full overflow-hidden"
      style={{
        backgroundColor: cardColor,
        borderRadius: `${BORDER_RADIUS}px ${BORDER_RADIUS}px 64px ${BORDER_RADIUS}px`,
        padding: "20px",
        paddingBottom: "24px",
        minHeight: "210px",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Doodle / Scribble */}
      <SignatureSvg
        strokeData={entry.stroke_data}
        className="w-full h-[90px] [&>svg]:w-full [&>svg]:h-full"
      />

      {/* Message */}
      {entry.message && (
        <p
          className="text-[12px] mt-[10px] leading-[1.5]"
          style={{
            color: textColor,
            opacity: 0.8,
            fontFamily,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {entry.message}
        </p>
      )}

      {/* Name + link + date */}
      <div className="mt-auto pt-[10px]">
        <span className="flex items-center gap-[4px]">
          <span
            className="text-[12px] font-semibold"
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
              <svg className="w-[12px] h-[12px]" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 7.667v3.889a1.555 1.555 0 0 1-1.556 1.555H2.556A1.556 1.556 0 0 1 1 11.556V4.667a1.556 1.556 0 0 1 1.556-1.556h3.888" />
                <path d="M9.444 1h3.667v3.667" />
                <path d="M5.667 8.333 13.11 1" />
              </svg>
            </a>
          )}
        </span>
        <span
          className="text-[10px] block mt-[2px]"
          style={{ color: textSecondary, opacity: 0.7 }}
        >
          {new Date(entry.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>

      {/* Corner fold flap — wider but shorter, with gradient stroke */}
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
