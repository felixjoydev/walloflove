"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { GuestbookSettings } from "@shared/types";
import type { DrawingData } from "@shared/types/drawing";
import { DEFAULT_SETTINGS } from "@shared/types";
import { WallNavbar } from "@/components/wall/wall-navbar";
import { SignatureSvg } from "@/components/wall/signature-svg";
import { DrawingCanvas } from "@/components/canvas/drawing-canvas";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ExpandedCardOverlay } from "@/components/wall/expanded-card-overlay";
import { getDotColor, darkenColor } from "@/lib/utils/color";

/* ─── Demo configuration ─── */

const DEMO_SETTINGS: Required<GuestbookSettings> = {
  ...DEFAULT_SETTINGS,
  wall_style: "sticky",
  moderation_mode: "auto_approve",
  wall_title: "Wall of Love",
  wall_description: "See what people are scribbling about us",
  collection_title: "Sign our Guestbook",
  collection_description: "Leave your mark with a scribble",
  show_message_field: true,
  show_link_field: false,
  brand_color: "#6366f1",
  button_text_color: "#ffffff",
  button_border_radius: 12,
  cta_text: "Sign the Guestbook",
  website_link: "https://guestbook.cv",
};

interface DemoEntry {
  id: string;
  name: string;
  message: string | null;
  link: string | null;
  stroke_data: unknown;
  created_at: string;
  signatureImg?: string;
}

const SEED_ENTRIES: DemoEntry[] = [
  { id: "demo-1", name: "Ronald", message: "You guys are awesome", link: null, stroke_data: null, created_at: "2026-02-16T00:00:00Z", signatureImg: "/signature-1.svg" },
  { id: "demo-2", name: "Sarah", message: "Love this product!", link: null, stroke_data: { note_color: "#D4C6FF" }, created_at: "2026-02-15T00:00:00Z", signatureImg: "/signature-2.svg" },
  { id: "demo-3", name: "Alex", message: "Super cool", link: null, stroke_data: { note_color: "#C6F0FF" }, created_at: "2026-02-14T00:00:00Z", signatureImg: "/signature-3.svg" },
  { id: "demo-4", name: "Jordan", message: "Really impressive", link: null, stroke_data: null, created_at: "2026-02-13T00:00:00Z", signatureImg: "/signature-4.svg" },
];

const STORAGE_KEY = "walloflove-demo-entries";
const TTL_MS = 5 * 60 * 1000;

function loadStoredEntries(): DemoEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const { entries, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    return entries;
  } catch {
    return [];
  }
}

function saveEntries(entries: DemoEntry[]) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ entries, timestamp: Date.now() })
  );
}

/* ─── Color helpers ─── */

const STICKY_COLORS = [
  "#F5F5F5", "#FFD0C8", "#FFE5CB", "#FFF9C6",
  "#D1F6D7", "#CBE9FF", "#E5D7FF", "#FFCBE9",
] as const;

const NOTE_COLOR = "#FFF9C6";
const BORDER_RADIUS = 24;

/* ─── Main component ─── */

export function HomepageDemo() {
  const [wallStyle, setWallStyle] = useState<"sticky" | "notebook">("notebook");
  const [viewMode, setViewMode] = useState<"grid" | "canvas">("grid");
  const [showCollect, setShowCollect] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<DemoEntry | null>(null);
  const [userEntries, setUserEntries] = useState<DemoEntry[]>(() => loadStoredEntries());

  const settings = { ...DEMO_SETTINGS, wall_style: wallStyle } as Required<GuestbookSettings>;
  const allEntries = [...userEntries, ...SEED_ENTRIES];
  const fontFamily = "system-ui, sans-serif";

  const handleNewEntry = useCallback((entry: DemoEntry) => {
    setUserEntries((prev) => {
      const updated = [entry, ...prev];
      saveEntries(updated);
      return updated;
    });
  }, []);

  return (
    <div>
      {/* Style switcher — glossy pill above the card */}
      <div className="flex items-center justify-center mb-[20px] -mt-[8px]">
        <div
          className="flex items-center gap-[6px] p-[6px]"
          style={{
            borderRadius: "1rem",
            background: "linear-gradient(0deg, #E6E6E6 0%, #FFF 100%)",
            boxShadow: "0 1px 3px 0 rgba(0,0,0,0.13), 0 -1.5px 0 0 rgba(255,255,255,0.45) inset, 0 1.5px 0 0 rgba(255,255,255,0.45) inset, 0 0 0 1px rgba(0,0,0,0.08), 0 7px 20px -5px rgba(0,0,0,0.10), 0 6px 14px -5px rgba(0,0,0,0.14)",
          }}
        >
          <button
            type="button"
            onClick={() => setWallStyle("notebook")}
            className="flex items-center justify-center cursor-pointer transition-all"
            style={{
              width: "64px",
              height: "52px",
              borderRadius: "0.75rem",
              border: wallStyle === "notebook" ? "1px solid #BCBCBC" : "1px solid transparent",
              background: wallStyle === "notebook" ? "#FFF" : "transparent",
            }}
          >
            <SwitcherNotebookIcon />
          </button>
          <button
            type="button"
            onClick={() => setWallStyle("sticky")}
            className="flex items-center justify-center cursor-pointer transition-all"
            style={{
              width: "64px",
              height: "52px",
              borderRadius: "0.75rem",
              border: wallStyle === "sticky" ? "1px solid #BCBCBC" : "1px solid transparent",
              background: wallStyle === "sticky" ? "#FFF" : "transparent",
            }}
          >
            <SwitcherStickyIcon />
          </button>
        </div>
      </div>

      {/* Demo card — 95vh tall, scrollable */}
      <div
        className="relative shadow-card overflow-hidden border border-border bg-bg-card"
        style={{ height: "95vh", backgroundColor: settings.background_color, borderRadius: "32px" }}
      >
        {/* Navbar — absolutely positioned with fade, sits above both grid and canvas */}
        <div
          className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, ${settings.background_color} 40%, transparent)`,
          }}
        >
          <div className="pointer-events-auto">
            <WallNavbar
              settings={settings}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>
        </div>

        {/* Content area */}
        {viewMode === "grid" ? (
          <div
            className="h-full overflow-hidden"
            style={{ backgroundColor: settings.background_color }}
          >
            <div
              className="mx-auto px-[16px] pb-[100px] pt-[80px]"
              style={{ maxWidth: wallStyle === "sticky" ? "780px" : "720px" }}
            >
              {/* Title */}
              <div className="pt-[24px]">
                <h1
                  className="text-[32px] font-bold text-center"
                  style={{ color: settings.text_color, fontFamily }}
                >
                  {settings.wall_title}
                </h1>
              </div>
              {settings.wall_description && (
                <p
                  className="text-[16px] mt-[4px] text-center"
                  style={{ color: settings.text_color, opacity: 0.7, fontFamily }}
                >
                  {settings.wall_description}
                </p>
              )}

              {/* Card grid — 3 cols for sticky, 2 cols for notebook */}
              <div
                className={
                  wallStyle === "sticky"
                    ? "mt-[40px] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[24px]"
                    : "mt-[40px] grid grid-cols-1 sm:grid-cols-2 gap-[16px]"
                }
              >
                {allEntries.map((entry) =>
                  wallStyle === "sticky" ? (
                    <DemoStickyCard key={entry.id} entry={entry} fontFamily={fontFamily} onClick={() => setExpandedEntry(entry)} />
                  ) : (
                    <DemoNotebookCard key={entry.id} entry={entry} settings={settings} fontFamily={fontFamily} onClick={() => setExpandedEntry(entry)} />
                  )
                )}
              </div>
            </div>

            {/* Floating CTA — sticky at bottom of grid scroll */}
            <div className="sticky bottom-0 z-10 flex justify-center pb-[24px] pt-[12px] pointer-events-none">
              <button
                onClick={() => setShowCollect(true)}
                className="pointer-events-auto relative inline-flex items-center justify-center overflow-hidden px-[24px] py-[12px] font-semibold text-[14px] shadow-card cursor-pointer hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: settings.brand_color,
                  color: settings.button_text_color,
                  borderRadius: `${settings.button_border_radius}px`,
                }}
              >
                <span className="absolute inset-0 -translate-x-full animate-[shimmer_2s_ease-in-out_infinite]" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)" }} />
                {settings.cta_text}
              </button>
            </div>
          </div>
        ) : (
          <>
            <DemoWallCanvas
              settings={settings}
              entries={allEntries}
              fontFamily={fontFamily}
              onEntryClick={setExpandedEntry}
            />
            {/* Floating CTA for canvas view */}
            <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-center pb-[24px] pt-[12px] pointer-events-none">
              <button
                onClick={() => setShowCollect(true)}
                className="pointer-events-auto relative inline-flex items-center justify-center overflow-hidden px-[24px] py-[12px] font-semibold text-[14px] shadow-card cursor-pointer hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: settings.brand_color,
                  color: settings.button_text_color,
                  borderRadius: `${settings.button_border_radius}px`,
                }}
              >
                <span className="absolute inset-0 -translate-x-full animate-[shimmer_2s_ease-in-out_infinite]" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)" }} />
                {settings.cta_text}
              </button>
            </div>
          </>
        )}

        {/* Expanded card overlay — absolute inside the 95vh container */}
        {expandedEntry && (
          <ExpandedCardOverlay
            entry={expandedEntry}
            cardType={wallStyle}
            settings={settings}
            fontFamily={fontFamily}
            onClose={() => setExpandedEntry(null)}
            signatureImg={expandedEntry.signatureImg}
            positioning="absolute"
          />
        )}

        {/* Collection modal — positioned against the fixed-height outer container, not the scrollable inner */}
        {showCollect && (
          <DemoCollectModal
            settings={settings}
            fontFamily={fontFamily}
            wallStyle={wallStyle}
            onClose={() => setShowCollect(false)}
            onSubmit={handleNewEntry}
          />
        )}
      </div>
    </div>
  );
}

/* ─── Demo Sticky Card (matches StickyNoteCard from sticky-grid.tsx) ─── */

function DemoStickyCard({
  entry,
  fontFamily,
  onClick,
}: {
  entry: DemoEntry;
  fontFamily: string;
  onClick: () => void;
}) {
  const strokeObj = entry.stroke_data as Record<string, unknown> | null;
  const cardColor = typeof strokeObj?.note_color === "string" ? strokeObj.note_color : NOTE_COLOR;
  const foldLight = darkenColor(cardColor, 0.05);
  const foldDark = darkenColor(cardColor, 0.18);
  const foldStroke = darkenColor(cardColor, 0.10);
  const textColor = darkenColor(cardColor, 0.55);
  const textSecondary = darkenColor(cardColor, 0.40);

  return (
    <div
      className="relative flex flex-col h-full overflow-hidden transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] cursor-pointer"
      style={{
        backgroundColor: cardColor,
        borderRadius: `${BORDER_RADIUS}px ${BORDER_RADIUS}px 64px ${BORDER_RADIUS}px`,
        padding: "20px",
        paddingBottom: "24px",
        minHeight: "210px",
        boxShadow: "var(--shadow-card)",
      }}
      onClick={onClick}
    >
      {/* Signature */}
      {entry.signatureImg ? (
        <img
          src={entry.signatureImg}
          alt={`${entry.name}'s signature`}
          className="w-full object-contain"
          style={{ height: "90px" }}
        />
      ) : (
        <SignatureSvg
          strokeData={entry.stroke_data}
          className="w-full h-[90px] [&>svg]:w-full [&>svg]:h-full"
        />
      )}

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

      {/* Name + date */}
      <div className="mt-auto pt-[10px]">
        <span
          className="text-[12px] font-semibold block"
          style={{ color: textColor, fontFamily }}
        >
          {entry.name}
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
          boxShadow: "-1px -1px 2px rgba(0,0,0,0.03), -1px -1px 2px rgba(0,0,0,0.02), 2px 3px 4px rgba(0,0,0,0.06)",
        }}
      />
    </div>
  );
}

/* ─── Demo Notebook Card (matches WallGrid cards from wall-grid.tsx) ─── */

function DemoNotebookCard({
  entry,
  settings,
  fontFamily,
  onClick,
}: {
  entry: DemoEntry;
  settings: Required<GuestbookSettings>;
  fontFamily: string;
  onClick: () => void;
}) {
  return (
    <div
      className="flex flex-col relative overflow-hidden transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] cursor-pointer"
      style={{
        borderRadius: `${settings.card_border_radius}px`,
        paddingTop: "16px",
        paddingRight: "16px",
        paddingBottom: "16px",
        paddingLeft: "40px",
      }}
      onClick={onClick}
    >
      {/* Card background */}
      <div
        className="absolute inset-0 border"
        style={{
          backgroundColor: settings.card_background_color,
          borderColor: settings.card_border_color,
          borderRadius: `${settings.card_border_radius}px`,
          boxShadow: "0px 3px 3px 0px rgba(0,0,0,0.06), 0px 1px 1px 0px rgba(0,0,0,0.06), 0px 0px 1px 0px rgba(0,0,0,0.06)",
        }}
      />
      {/* Punch holes */}
      <div className="absolute left-[12px] top-0 bottom-0 flex flex-col items-center justify-evenly pointer-events-none z-10">
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
        {/* Signature */}
        {entry.signatureImg ? (
          <div
            className="w-full flex items-center justify-center"
            style={{
              height: "120px",
              backgroundColor: settings.canvas_background_color,
              backgroundImage: `radial-gradient(circle, ${getDotColor(settings.background_color)} 1px, transparent 1px)`,
              backgroundSize: "20px 20px",
              borderRadius: "8px",
            }}
          >
            <img
              src={entry.signatureImg}
              alt={`${entry.name}'s signature`}
              className="max-w-full max-h-full object-contain"
              style={{ height: "100px" }}
            />
          </div>
        ) : (
          <SignatureSvg
            strokeData={entry.stroke_data}
            className="w-full h-[120px] [&>svg]:w-full [&>svg]:h-full"
            style={{
              backgroundColor: settings.canvas_background_color,
              backgroundImage: `radial-gradient(circle, ${getDotColor(settings.background_color)} 1px, transparent 1px)`,
              backgroundSize: "20px 20px",
              borderRadius: "8px",
            }}
          />
        )}
        {/* Message */}
        {entry.message && (
          <p
            className="text-[14px] mt-[12px]"
            style={{
              color: settings.card_text_color,
              opacity: 0.7,
              fontFamily,
            }}
          >
            {entry.message}
          </p>
        )}
        {/* Name + date */}
        <div className="flex flex-col gap-[2px] mt-auto pt-[12px]">
          <span
            className="text-[14px] font-medium"
            style={{ color: settings.card_text_color, fontFamily }}
          >
            {entry.name}
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

/* ─── Demo Wall Canvas (handles signatureImg + shows sender name) ─── */

const CELL_WIDTH = 200;
const CELL_HEIGHT = 160; // taller to fit name label
const CANVAS_GAP = 24;
const JITTER = 12;
const ZOOM_STEP = 0.15;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2;
const DRAG_THRESHOLD = 5;

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function DemoWallCanvas({
  settings,
  entries,
  fontFamily,
  onEntryClick,
}: {
  settings: Required<GuestbookSettings>;
  entries: DemoEntry[];
  fontFamily: string;
  onEntryClick: (entry: DemoEntry) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const centeredRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const panRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
    moved: boolean;
    clickedEntryIndex: number | null;
  } | null>(null);

  const cols = Math.max(1, Math.floor(1400 / (CELL_WIDTH + CANVAS_GAP)));

  const positions = useMemo(() => {
    return entries.map((entry, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const hash = simpleHash(entry.id);
      const jitterX = (hash % (JITTER * 2 + 1)) - JITTER;
      const jitterY = ((hash >> 8) % (JITTER * 2 + 1)) - JITTER;
      return {
        x: col * (CELL_WIDTH + CANVAS_GAP) + CANVAS_GAP + jitterX,
        y: row * (CELL_HEIGHT + CANVAS_GAP) + CANVAS_GAP + jitterY,
      };
    });
  }, [entries, cols]);

  const rows = Math.ceil(entries.length / cols);
  const canvasWidth = cols * (CELL_WIDTH + CANVAS_GAP) + CANVAS_GAP;
  const canvasHeight = rows * (CELL_HEIGHT + CANVAS_GAP) + CANVAS_GAP;

  const contentCenter = useMemo(() => {
    if (positions.length === 0) return { x: canvasWidth / 2, y: canvasHeight / 2 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const pos of positions) {
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + CELL_WIDTH);
      maxY = Math.max(maxY, pos.y + CELL_HEIGHT);
    }
    return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  }, [positions, canvasWidth, canvasHeight]);

  const getCenterOffset = useCallback(() => {
    const el = containerRef.current;
    const vw = el ? el.clientWidth : 1000;
    const vh = el ? el.clientHeight : 700;
    return {
      x: vw / 2 - contentCenter.x,
      y: vh / 2 - contentCenter.y,
    };
  }, [contentCenter.x, contentCenter.y]);

  useEffect(() => {
    if (entries.length > 0 && !centeredRef.current) {
      centeredRef.current = true;
      const rafId = requestAnimationFrame(() => {
        setOffset(getCenterOffset());
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [entries.length, getCenterOffset]);

  const handleReset = useCallback(() => {
    setZoom(1);
    setOffset(getCenterOffset());
  }, [getCenterOffset]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest("[data-no-pan]")) return;
      const entryEl = (e.target as HTMLElement).closest("[data-entry-index]");
      const clickedEntryIndex = entryEl ? Number(entryEl.getAttribute("data-entry-index")) : null;
      panRef.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        startOffsetX: offset.x,
        startOffsetY: offset.y,
        moved: false,
        clickedEntryIndex,
      };
      setIsDragging(false);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [offset.x, offset.y]
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const pan = panRef.current;
    if (!pan?.active) return;
    const dx = e.clientX - pan.startX;
    const dy = e.clientY - pan.startY;
    if (!pan.moved && Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD) {
      pan.moved = true;
      setIsDragging(true);
    }
    if (pan.moved) {
      setOffset({ x: pan.startOffsetX + dx, y: pan.startOffsetY + dy });
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    const pan = panRef.current;
    if (pan && !pan.moved && pan.clickedEntryIndex !== null) {
      const entry = entries[pan.clickedEntryIndex];
      if (entry) onEntryClick(entry);
    }
    panRef.current = null;
    setIsDragging(false);
  }, [entries, onEntryClick]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* Zoom controls */}
      <div className="absolute right-[48px] top-1/2 -translate-y-1/2 z-10 flex flex-col gap-[8px]" data-no-pan>
        <div className="flex flex-col gap-[4px]">
          <button
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)))}
            className="w-[36px] h-[36px] flex items-center justify-center rounded-t-icon border border-border bg-bg-card shadow-card-sm cursor-pointer hover:bg-bg-subtle transition-colors text-[18px] font-medium text-text-primary"
          >
            +
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)))}
            className="w-[36px] h-[36px] flex items-center justify-center rounded-b-icon border border-border bg-bg-card shadow-card-sm cursor-pointer hover:bg-bg-subtle transition-colors text-[18px] font-medium text-text-primary"
          >
            &minus;
          </button>
        </div>
        <button
          onClick={handleReset}
          title="Reset view"
          className="w-[36px] h-[36px] flex items-center justify-center rounded-icon border border-border bg-bg-card shadow-card-sm cursor-pointer hover:bg-bg-subtle transition-colors text-icon-inactive hover:text-icon-active"
        >
          <svg className="w-[16px] h-[16px]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="8" cy="8" r="2" />
            <line x1="8" y1="1" x2="8" y2="5" />
            <line x1="8" y1="11" x2="8" y2="15" />
            <line x1="1" y1="8" x2="5" y2="8" />
            <line x1="11" y1="8" x2="15" y2="8" />
          </svg>
        </button>
      </div>

      {/* Infinite canvas viewport */}
      <div
        className="w-full h-full overflow-hidden select-none"
        style={{
          cursor: isDragging ? "grabbing" : "grab",
          backgroundImage: `radial-gradient(circle, ${getDotColor(settings.background_color)} 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
          backgroundPosition: `${(offset.x % 20) + 10}px ${(offset.y % 20) + 10}px`,
          WebkitUserSelect: "none",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            width: canvasWidth,
            height: canvasHeight,
            position: "relative",
          }}
        >
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              data-entry-index={i}
              className="absolute cursor-pointer hover:opacity-80 transition-opacity"
              style={{
                left: positions[i].x,
                top: positions[i].y,
                width: CELL_WIDTH,
                height: CELL_HEIGHT,
              }}
            >
              {/* Signature */}
              <div className="w-full" style={{ height: CELL_HEIGHT - 28 }}>
                {entry.signatureImg ? (
                  <img
                    src={entry.signatureImg}
                    alt={`${entry.name}'s signature`}
                    className="w-full h-full object-contain pointer-events-none"
                    draggable={false}
                  />
                ) : (
                  <SignatureSvg
                    strokeData={entry.stroke_data}
                    className="w-full h-full [&>svg]:w-full [&>svg]:h-full pointer-events-none"
                  />
                )}
              </div>
              {/* Sender name */}
              <p
                className="text-[12px] font-medium text-center mt-[4px] truncate"
                style={{ color: settings.text_color, opacity: 0.6, fontFamily }}
              >
                {entry.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Style switcher icons (larger, for the glossy pill switcher) ─── */

function SwitcherNotebookIcon() {
  return (
    <div
      className="w-[44px] h-[40px] relative overflow-hidden shrink-0"
      style={{
        borderRadius: "6px",
        backgroundColor: "#ffffff",
        border: "1px solid #E5E5E5",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <div className="absolute left-[3px] top-[3px] bottom-[3px] flex flex-col items-center justify-between pointer-events-none">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="w-[5px] h-[5px] rounded-full"
            style={{ backgroundColor: "#D0D0D0" }}
          />
        ))}
      </div>
      <div className="absolute left-[12px] right-[4px] top-[5px] bottom-[5px] flex items-center justify-center">
        <svg className="w-full h-full" viewBox="0 0 42 63" fill="none">
          <path d="M1 31.3618C2.76123 28.6672 5.38716 20.4247 4.94959 8.6698C4.80134 4.68741 3.90876 2.17915 3.4144 1.65592C-1.72304 -3.78153 6.0098 25.5164 7.15353 55.1465C7.35921 60.4748 6.83547 61.6437 6.20364 61.9306C5.57181 62.2174 4.60156 61.5907 3.80265 60.5009C2.04412 58.1019 1.9624 54.5844 2.6827 50.9848C4.28251 42.9898 9.48864 39.4278 13.4417 36.9359C17.3352 34.4814 23.0119 35.1459 28.0535 34.1892C32.5082 33.3438 34.7166 27.955 38.3961 24.5107C39.2415 23.4891 39.8855 22.1986 40.2917 22.2232C40.6978 22.2478 40.8467 23.6266 41 25.0471" stroke="#B0B0B0" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

function SwitcherStickyIcon() {
  return (
    <div
      className="w-[44px] h-[40px] relative overflow-hidden shrink-0"
      style={{
        borderRadius: "5px 5px 12px 5px",
        backgroundColor: "#FFF9C6",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      <div className="absolute left-[5px] right-[5px] top-[4px] bottom-[4px] flex items-center justify-center">
        <svg className="w-full h-full" viewBox="0 0 42 63" fill="none">
          <path d="M1 31.3618C2.76123 28.6672 5.38716 20.4247 4.94959 8.6698C4.80134 4.68741 3.90876 2.17915 3.4144 1.65592C-1.72304 -3.78153 6.0098 25.5164 7.15353 55.1465C7.35921 60.4748 6.83547 61.6437 6.20364 61.9306C5.57181 62.2174 4.60156 61.5907 3.80265 60.5009C2.04412 58.1019 1.9624 54.5844 2.6827 50.9848C4.28251 42.9898 9.48864 39.4278 13.4417 36.9359C17.3352 34.4814 23.0119 35.1459 28.0535 34.1892C32.5082 33.3438 34.7166 27.955 38.3961 24.5107C39.2415 23.4891 39.8855 22.1986 40.2917 22.2232C40.6978 22.2478 40.8467 23.6266 41 25.0471" stroke="#D4CB82" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
      <div
        className="absolute bottom-0 right-0 pointer-events-none"
        style={{
          width: "12px",
          height: "12px",
          borderTopLeftRadius: "5px",
          border: "0.5px solid transparent",
          backgroundImage: "linear-gradient(132deg, #F5EFB0 79.5%, #E0D88A 85.97%), linear-gradient(135deg, transparent 0%, #E8E0A0 100%)",
          backgroundOrigin: "padding-box, border-box",
          backgroundClip: "padding-box, border-box",
        }}
      />
    </div>
  );
}

/* ─── Demo Collection Modal (no API calls) ─── */

function DemoCollectModal({
  settings,
  fontFamily,
  wallStyle,
  onClose,
  onSubmit,
}: {
  settings: Required<GuestbookSettings>;
  fontFamily: string;
  wallStyle: "sticky" | "notebook";
  onClose: () => void;
  onSubmit: (entry: DemoEntry) => void;
}) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [drawingData, setDrawingData] = useState<DrawingData | null>(null);
  const [selectedColor, setSelectedColor] = useState("#FFF9C6");

  const handleDrawingChange = useCallback((data: DrawingData) => {
    setDrawingData(data);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const entry: DemoEntry = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      message: message.trim() || null,
      link: null,
      stroke_data: {
        ...(drawingData ?? { version: 1, width: 400, height: 250, strokes: [] }),
        ...(wallStyle === "sticky" ? { note_color: selectedColor } : {}),
      },
      created_at: new Date().toISOString(),
    };

    onSubmit(entry);
    onClose();
  }

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center px-[16px]"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div
        className="relative w-full max-w-md max-h-[85vh] overflow-y-auto overscroll-y-contain rounded-card"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily }}
      >
        <Card>
            <form onSubmit={handleSubmit} className="flex flex-col gap-[16px] p-[24px]">
              <div className="text-center flex flex-col items-center gap-[4px]">
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

              {wallStyle === "sticky" && (
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
                {...(wallStyle === "sticky" ? {
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

              <button
                type="submit"
                className="flex items-center justify-center font-semibold h-[44px] w-full rounded-input transition-opacity hover:opacity-90 cursor-pointer disabled:opacity-50"
                style={{
                  backgroundColor: settings.brand_color,
                  color: settings.button_text_color,
                  borderRadius: `${settings.button_border_radius}px`,
                }}
              >
                {settings.cta_text}
              </button>
            </form>
        </Card>
      </div>
    </div>
  );
}
