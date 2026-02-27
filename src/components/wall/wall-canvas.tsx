"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import type { GuestbookSettings } from "@shared/types";
import { SignatureSvg } from "./signature-svg";
import { ExpandedCardOverlay } from "./expanded-card-overlay";
import { getDotColor } from "@/lib/utils/color";

interface Entry {
  id: string;
  name: string;
  message: string | null;
  link: string | null;
  stroke_data: unknown;
  created_at: string;
}

const CELL_WIDTH = 200;
const CELL_HEIGHT = 140;
const GAP = 24;
const JITTER = 12;
const ZOOM_STEP = 0.15;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2;
const DRAG_THRESHOLD = 5; // pixels moved before it counts as a drag (not a click)

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function WallCanvas({
  settings,
  entries,
  fontFamily,
  loading,
  cardType = "notebook",
}: {
  settings: Required<GuestbookSettings>;
  entries: Entry[];
  fontFamily: string;
  loading: boolean;
  cardType?: "sticky" | "notebook";
}) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const centeredRef = useRef(false);

  // Refs for pan tracking
  const panRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
    moved: boolean;
    clickedEntryId: string | null;
  } | null>(null);

  // Compute columns based on a reasonable default canvas width
  const cols = Math.max(1, Math.floor(1400 / (CELL_WIDTH + GAP)));

  const positions = useMemo(() => {
    return entries.map((entry, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const hash = simpleHash(entry.id);
      const jitterX = (hash % (JITTER * 2 + 1)) - JITTER;
      const jitterY = ((hash >> 8) % (JITTER * 2 + 1)) - JITTER;

      return {
        x: col * (CELL_WIDTH + GAP) + GAP + jitterX,
        y: row * (CELL_HEIGHT + GAP) + GAP + jitterY,
      };
    });
  }, [entries, cols]);

  const rows = Math.ceil(entries.length / cols);
  const canvasWidth = cols * (CELL_WIDTH + GAP) + GAP;
  const canvasHeight = rows * (CELL_HEIGHT + GAP) + GAP;

  // Compute actual bounding-box center of placed signatures
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

  // Compute centered offset — places the content center at the viewport center (at zoom 1)
  const getCenterOffset = useCallback(() => {
    const vw = typeof window !== "undefined" ? window.innerWidth : 1400;
    const vh = typeof window !== "undefined" ? window.innerHeight : 900;
    return {
      x: vw / 2 - contentCenter.x,
      y: vh / 2 - contentCenter.y,
    };
  }, [contentCenter.x, contentCenter.y]);

  // Center the view when entries first load
  useEffect(() => {
    if (entries.length > 0 && !centeredRef.current) {
      centeredRef.current = true;
      const rafId = requestAnimationFrame(() => {
        setOffset(getCenterOffset());
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [entries.length, getCenterOffset]);

  // Reset handler — snap back to center with default zoom
  const handleReset = useCallback(() => {
    setZoom(1);
    setOffset(getCenterOffset());
    setSelectedEntryId(null);
  }, [getCenterOffset]);

  // Pan handlers
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Ignore if clicking on a popup link or zoom button
      if ((e.target as HTMLElement).closest("[data-no-pan]")) return;

      // Check if clicking on an entry (to handle selection in pointerup,
      // since setPointerCapture redirects click events away from the entry)
      const entryEl = (e.target as HTMLElement).closest("[data-entry-id]");
      const clickedEntryId = entryEl?.getAttribute("data-entry-id") ?? null;

      panRef.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        startOffsetX: offset.x,
        startOffsetY: offset.y,
        moved: false,
        clickedEntryId,
      };
      setIsDragging(false);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [offset.x, offset.y]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const pan = panRef.current;
      if (!pan?.active) return;

      const dx = e.clientX - pan.startX;
      const dy = e.clientY - pan.startY;

      if (!pan.moved && Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD) {
        pan.moved = true;
        setIsDragging(true);
      }

      if (pan.moved) {
        setOffset({
          x: pan.startOffsetX + dx,
          y: pan.startOffsetY + dy,
        });
      }
    },
    []
  );

  const handlePointerUp = useCallback(() => {
    const pan = panRef.current;
    if (pan && !pan.moved) {
      if (pan.clickedEntryId) {
        // Clicked on an entry — toggle selection
        setSelectedEntryId((prev) =>
          prev === pan.clickedEntryId ? null : pan.clickedEntryId
        );
      } else {
        // Clicked on empty canvas — deselect
        setSelectedEntryId(null);
      }
    }
    panRef.current = null;
    setIsDragging(false);
  }, []);

  const selectedEntry = entries.find((e) => e.id === selectedEntryId);

  if (loading && entries.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: "100vh" }}>
        <p
          className="text-[14px]"
          style={{ color: settings.text_color, opacity: 0.5 }}
        >
          Loading signatures...
        </p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: "100vh" }}>
        <p
          className="text-[14px]"
          style={{ color: settings.text_color, opacity: 0.5 }}
        >
          No entries yet. Be the first to sign!
        </p>
      </div>
    );
  }

  return (
    <div className="relative" style={{ height: "100vh" }}>
      {/* Zoom controls + reset */}
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
        className="w-full h-full overflow-hidden"
        style={{
          cursor: isDragging ? "grabbing" : "grab",
          backgroundImage:
            `radial-gradient(circle, ${getDotColor(settings.background_color)} 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
          backgroundPosition: `${(offset.x % 20) + 10}px ${(offset.y % 20) + 10}px`,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Transformed inner layer */}
        <div
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            width: canvasWidth,
            height: canvasHeight,
            position: "relative",
          }}
        >
          {/* Signatures */}
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              data-entry-id={entry.id}
              className="absolute cursor-pointer hover:opacity-80 transition-opacity"
              style={{
                left: positions[i].x,
                top: positions[i].y,
                width: CELL_WIDTH,
                height: CELL_HEIGHT,
              }}
            >
              <SignatureSvg
                strokeData={entry.stroke_data}
                className="w-full h-full [&>svg]:w-full [&>svg]:h-full pointer-events-none"
              />
            </div>
          ))}
        </div>

      </div>

      {/* Expanded card overlay */}
      {selectedEntry && (
        <ExpandedCardOverlay
          entry={selectedEntry}
          cardType={cardType}
          settings={settings}
          fontFamily={fontFamily}
          onClose={() => setSelectedEntryId(null)}
        />
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="absolute bottom-[24px] left-1/2 -translate-x-1/2 z-10">
          <p
            className="text-[13px] px-[12px] py-[6px] rounded-icon border border-border bg-bg-card shadow-card-sm"
            style={{ color: settings.text_color, opacity: 0.7 }}
          >
            Loading more signatures...
          </p>
        </div>
      )}
    </div>
  );
}
