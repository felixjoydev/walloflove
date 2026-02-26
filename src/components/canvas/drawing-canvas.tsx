"use client";

import {
  useRef,
  useReducer,
  useEffect,
  useCallback,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { DrawingData } from "@shared/types/drawing";
import { MAX_STROKES, MAX_POINTS_TOTAL } from "@shared/types/drawing";
import { strokeDataToSvg } from "./stroke-to-svg";
import {
  PEN_COLORS,
  PEN_SIZES,
  MARKER_SIZE,
  ERASER_SIZE,
  MARKER_OPACITY,
  DEFAULT_COLOR,
  DEFAULT_SIZE,
  type Tool,
} from "./constants";

/* ─── Types ─── */

interface Stroke {
  points: [number, number, number][];
  color: string;
  size: number;
  tool: Tool;
  opacity: number;
}

interface CanvasState {
  strokes: Stroke[];
  redoStack: Stroke[];
  activeTool: Tool;
  pencilColor: string;
  markerColor: string;
  activeSize: number;
  toolRaised: boolean;
  popoverOpen: boolean;
}

type Action =
  | { type: "COMMIT_STROKE"; stroke: Stroke }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "CLEAR" }
  | { type: "SET_TOOL"; tool: Tool }
  | { type: "SET_COLOR"; color: string }
  | { type: "SET_SIZE"; size: number }
  | { type: "CLOSE_POPOVER" };

function reducer(state: CanvasState, action: Action): CanvasState {
  switch (action.type) {
    case "COMMIT_STROKE":
      return {
        ...state,
        strokes: [...state.strokes, action.stroke],
        redoStack: [],
      };
    case "UNDO": {
      if (state.strokes.length === 0) return state;
      const last = state.strokes[state.strokes.length - 1];
      return {
        ...state,
        strokes: state.strokes.slice(0, -1),
        redoStack: [...state.redoStack, last],
      };
    }
    case "REDO": {
      if (state.redoStack.length === 0) return state;
      const restored = state.redoStack[state.redoStack.length - 1];
      return {
        ...state,
        strokes: [...state.strokes, restored],
        redoStack: state.redoStack.slice(0, -1),
      };
    }
    case "CLEAR":
      return { ...state, strokes: [], redoStack: [] };
    case "SET_TOOL": {
      if (state.activeTool === action.tool) {
        // Eraser: simple raise/lower toggle (no popover)
        if (action.tool === "eraser") {
          return { ...state, toolRaised: !state.toolRaised, popoverOpen: false };
        }
        // Popover open → lower tool entirely
        if (state.popoverOpen) {
          return { ...state, toolRaised: false, popoverOpen: false };
        }
        // Tool raised but popover closed → re-open popover
        if (state.toolRaised) {
          return { ...state, popoverOpen: true };
        }
        // Tool lowered → raise + open popover
        return { ...state, toolRaised: true, popoverOpen: true };
      }
      // Switching tools
      return {
        ...state,
        activeTool: action.tool,
        toolRaised: true,
        popoverOpen: action.tool !== "eraser",
      };
    }
    case "SET_COLOR":
      if (state.activeTool === "pencil") {
        return { ...state, pencilColor: action.color, popoverOpen: false };
      }
      if (state.activeTool === "marker") {
        return { ...state, markerColor: action.color, popoverOpen: false };
      }
      return state;
    case "SET_SIZE":
      return { ...state, activeSize: action.size };
    case "CLOSE_POPOVER":
      if (!state.popoverOpen) return state;
      return { ...state, popoverOpen: false };
    default:
      return state;
  }
}

/* ─── Color helpers ─── */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.min(255, Math.max(0, Math.round(v))))
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}

/** Lighten a hex color by mixing it toward white by the given amount (0–1). */
function lightenHex(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(
    r + (255 - r) * amount,
    g + (255 - g) * amount,
    b + (255 - b) * amount,
  );
}

/* ─── Props ─── */

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  backgroundColor?: string;
  onChange?: (data: DrawingData) => void;
  onEmptyChange?: (isEmpty: boolean) => void;
  colorOverride?: string;
  brandColor?: string;
  className?: string;
  showDotGrid?: boolean;
  showInsetShadow?: boolean;
  drawerColor?: string;
}

/* ─── Component ─── */

export function DrawingCanvas({
  width = 400,
  height = 250,
  backgroundColor = "#F6F6F6",
  onChange,
  onEmptyChange,
  colorOverride,
  brandColor = "#9580FF",
  className,
  showDotGrid = true,
  showInsetShadow = true,
  drawerColor = "#ECECEC",
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const activePointerRef = useRef<number | null>(null);
  const dprRef = useRef(1);
  const prevEmptyRef = useRef(true);

  const [state, dispatch] = useReducer(reducer, {
    strokes: [],
    redoStack: [],
    activeTool: "pencil",
    pencilColor: DEFAULT_COLOR,
    markerColor: DEFAULT_COLOR,
    activeSize: DEFAULT_SIZE,
    toolRaised: false,
    popoverOpen: false,
  });

  // Derive active color from the current tool
  const activeColor =
    state.activeTool === "marker" ? state.markerColor : state.pencilColor;

  // Store latest state in ref for pointer event handlers (avoids stale closures)
  const stateRef = useRef(state);
  stateRef.current = state;

  // Initialize DPR
  useEffect(() => {
    dprRef.current = Math.min(window.devicePixelRatio || 1, 2);
  }, []);

  // Rebuild SVG from committed strokes (when not actively drawing)
  const rebuildSvg = useCallback(
    (strokes: Stroke[], inProgressStroke?: Stroke | null) => {
      if (!svgRef.current) return;
      const allStrokes = inProgressStroke
        ? [...strokes, inProgressStroke]
        : strokes;

      if (allStrokes.length === 0) {
        svgRef.current.innerHTML = "";
        return;
      }

      const data: DrawingData = {
        version: 1,
        width,
        height,
        strokes: allStrokes,
      };
      svgRef.current.innerHTML = strokeDataToSvg(data, colorOverride);
    },
    [width, height, colorOverride]
  );

  // Re-render SVG when committed strokes change or colorOverride changes
  useEffect(() => {
    rebuildSvg(state.strokes);
  }, [state.strokes, rebuildSvg]);

  // Notify parent of changes
  useEffect(() => {
    const isEmpty = state.strokes.length === 0;
    if (isEmpty !== prevEmptyRef.current) {
      prevEmptyRef.current = isEmpty;
      onEmptyChange?.(isEmpty);
    }
    onChange?.({
      version: 1,
      width,
      height,
      strokes: state.strokes,
    });
  }, [state.strokes, width, height, onChange, onEmptyChange]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          dispatch({ type: "REDO" });
        } else {
          dispatch({ type: "UNDO" });
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  /* ─── Pointer event handlers ─── */

  function getCoords(e: ReactPointerEvent): [number, number] {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * width);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * height);
    return [x, y];
  }

  function getStrokeSize(): number {
    const s = stateRef.current;
    if (s.activeTool === "marker") return MARKER_SIZE;
    if (s.activeTool === "eraser") return ERASER_SIZE;
    return s.activeSize;
  }

  function onPointerDown(e: ReactPointerEvent) {
    e.preventDefault();
    if (activePointerRef.current !== null) return;
    if (stateRef.current.strokes.length >= MAX_STROKES) return;

    activePointerRef.current = e.pointerId;
    canvasRef.current?.setPointerCapture(e.pointerId);
    dispatch({ type: "CLOSE_POPOVER" });

    const [x, y] = getCoords(e);
    const s = stateRef.current;
    const color = s.activeTool === "marker" ? s.markerColor : s.pencilColor;

    currentStrokeRef.current = {
      points: [[x, y, e.pressure || 0.5]],
      color,
      size: getStrokeSize(),
      tool: s.activeTool,
      opacity: s.activeTool === "marker" ? MARKER_OPACITY : 1,
    };
  }

  function onPointerMove(e: ReactPointerEvent) {
    e.preventDefault();
    if (e.pointerId !== activePointerRef.current || !currentStrokeRef.current)
      return;

    const totalPoints = stateRef.current.strokes.reduce(
      (sum, s) => sum + s.points.length,
      0
    );
    if (totalPoints + currentStrokeRef.current.points.length >= MAX_POINTS_TOTAL)
      return;

    const [x, y] = getCoords(e);
    currentStrokeRef.current.points.push([x, y, e.pressure || 0.5]);
    rebuildSvg(stateRef.current.strokes, currentStrokeRef.current);
  }

  function onPointerUp(e: ReactPointerEvent) {
    if (e.pointerId !== activePointerRef.current) return;
    activePointerRef.current = null;

    if (currentStrokeRef.current && currentStrokeRef.current.points.length > 1) {
      dispatch({ type: "COMMIT_STROKE", stroke: currentStrokeRef.current });
    }
    currentStrokeRef.current = null;
  }

  /* ─── Tool icon components ─── */

  const canUndo = state.strokes.length > 0;
  const canRedo = state.redoStack.length > 0;
  const canClear = state.strokes.length > 0;

  return (
    <div className={className}>
      {/* Canvas area */}
      <div
        className="relative overflow-hidden rounded-card"
        style={{
          backgroundColor,
          width: "100%",
          aspectRatio: `${width}/${height}`,
          boxShadow: showInsetShadow ? "0 2px 2px 0 rgba(0, 0, 0, 0.10) inset" : "none",
        }}
      >
        {/* Dot grid background */}
        {showDotGrid && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle, #D9D9D9 1px, transparent 1px)",
              backgroundSize: "20px 20px",
              backgroundPosition: "10px 10px",
              zIndex: 0,
            }}
          />
        )}

        {/* Invisible canvas for pointer capture */}
        <canvas
          ref={canvasRef}
          width={width * (dprRef.current || 1)}
          height={height * (dprRef.current || 1)}
          style={{
            width: "100%",
            height: "100%",
            touchAction: "none",
            position: "absolute",
            inset: 0,
            zIndex: 2,
            opacity: 0,
            cursor:
              state.activeTool === "pencil"
                ? "url('/pencil-pointer.svg') 1 16, crosshair"
                : state.activeTool === "marker"
                  ? "url('/marker-pointer.svg') 2 17, crosshair"
                  : "url('/eraser-pointer.svg') 2 17, crosshair",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={onPointerUp}
        />

        {/* SVG overlay */}
        <div
          ref={svgRef}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            pointerEvents: "none",
          }}
          className="[&>svg]:w-full [&>svg]:h-full"
        />

        {/* Undo / Redo / Clear */}
        <div
          className="absolute top-[12px] left-[12px] right-[12px] flex items-center justify-between pointer-events-none"
          style={{ zIndex: 3 }}
        >
          <div className="flex items-center gap-[4px]">
            <button
              type="button"
              onClick={() => dispatch({ type: "UNDO" })}
              disabled={!canUndo}
              className="p-[4px] rounded-[6px] transition-opacity disabled:opacity-25 pointer-events-auto"
              aria-label="Undo"
            >
              <UndoIcon />
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "REDO" })}
              disabled={!canRedo}
              className="p-[4px] rounded-[6px] transition-opacity disabled:opacity-25 pointer-events-auto"
              aria-label="Redo"
            >
              <RedoIcon />
            </button>
          </div>
          <button
            type="button"
            onClick={() => dispatch({ type: "CLEAR" })}
            disabled={!canClear}
            className="text-[14px] font-medium text-text-secondary transition-opacity disabled:opacity-25 pointer-events-auto"
          >
            Clear
          </button>
        </div>

        {/* Tool drawer — compact width, centered at bottom */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ zIndex: 3 }}
        >
          {/* Drawer background: rounded top corners only, flush bottom */}
          <div className="absolute bottom-0 inset-x-0 h-[52px] rounded-t-[20px]" style={{ backgroundColor: drawerColor }} />

          {/* Tools + popovers positioned above drawer */}
          <div className="relative flex justify-center items-end gap-[24px] px-[28px] pb-[10px]">
            {(["pencil", "marker", "eraser"] as const).map((tool) => (
              <div key={tool} className="relative flex flex-col items-center">
                {/* Popover */}
                {state.activeTool === tool && state.popoverOpen && tool !== "eraser" && (
                  <div
                    className="absolute bottom-full mb-[12px] rounded-[12px] bg-bg-card border border-border shadow-card p-[10px] flex items-center gap-[8px] pointer-events-auto"
                    style={{
                      animation: "popover-in 150ms ease-out",
                    }}
                  >
                    {/* Color dots */}
                    <div className="flex gap-[8px]">
                      {PEN_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() =>
                            dispatch({ type: "SET_COLOR", color })
                          }
                          className="relative w-[16px] h-[16px] rounded-full transition-transform"
                          style={{
                            backgroundColor: color,
                            boxShadow:
                              activeColor === color
                                ? `0 0 0 2px ${backgroundColor}, 0 0 0 4px ${color}`
                                : "none",
                            transform:
                              activeColor === color
                                ? "scale(1.1)"
                                : "scale(1)",
                          }}
                          aria-label={`Color ${color}`}
                        />
                      ))}
                    </div>

                    {/* Divider + size icons (pencil only) */}
                    {tool === "pencil" && (
                      <>
                        <div className="w-px h-[18px] bg-border" />
                        <div className="flex gap-[8px] items-center">
                          {PEN_SIZES.map((s, i) => (
                            <button
                              key={s.value}
                              type="button"
                              onClick={() =>
                                dispatch({ type: "SET_SIZE", size: s.value })
                              }
                              className="flex items-center justify-center transition-all w-[20px] h-[20px] rounded-[4px]"
                              style={{
                                opacity: state.activeSize === s.value ? 1 : 0.35,
                                backgroundColor:
                                  state.activeSize === s.value
                                    ? `color-mix(in srgb, ${activeColor} 20%, transparent)`
                                    : "transparent",
                              }}
                              aria-label={`Size ${s.label}`}
                            >
                              <PencilSizeIcon index={i} color={state.activeSize === s.value ? activeColor : "#494949"} />
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Tool button */}
                <button
                  type="button"
                  onClick={() => dispatch({ type: "SET_TOOL", tool })}
                  className="transition-all duration-200 ease-out pointer-events-auto"
                  style={{
                    transform:
                      state.activeTool === tool && state.toolRaised
                        ? "translateY(-8px)"
                        : "translateY(0)",
                    filter:
                      state.activeTool === tool && state.toolRaised
                        ? "drop-shadow(0 6px 8px rgba(0, 0, 0, 0.15))"
                        : "none",
                  }}
                  aria-label={tool}
                >
                  {tool === "pencil" && (
                    <PencilIcon nibColor={state.pencilColor} />
                  )}
                  {tool === "marker" && (
                    <MarkerIcon nibColor={state.markerColor} />
                  )}
                  {tool === "eraser" && <EraserIcon brandColor={brandColor} />}
                </button>

                {/* Color indicator nub — pinned to drawer bottom */}
                {state.activeTool === tool && state.toolRaised && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 bottom-[-10px] transition-colors duration-200"
                    style={{
                      width: 8,
                      height: 4,
                      borderRadius: "2px 2px 0 0",
                      backgroundColor:
                        tool === "eraser"
                          ? brandColor
                          : tool === "pencil"
                            ? state.pencilColor
                            : state.markerColor,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Inline SVG Icons ─── */

function UndoIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.4714 2.86192C6.73175 3.12227 6.73175 3.54438 6.4714 3.80473L4.27614 5.99999L10.6667 5.99999C12.5076 5.99999 14 7.49237 14 9.33332V12.6667C14 13.0348 13.7015 13.3333 13.3333 13.3333C12.9651 13.3333 12.6667 13.0348 12.6667 12.6667V9.33332C12.6667 8.22875 11.7712 7.33332 10.6667 7.33332L4.27614 7.33332L6.4714 9.52859C6.73175 9.78893 6.73175 10.211 6.4714 10.4714C6.21106 10.7317 5.78895 10.7317 5.5286 10.4714L2.19526 7.13806C1.93491 6.87771 1.93491 6.4556 2.19526 6.19525L5.5286 2.86192C5.78894 2.60157 6.21105 2.60157 6.4714 2.86192Z"
        fill="currentColor"
      />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.5286 2.86192C9.78895 2.60157 10.2111 2.60157 10.4714 2.86192L13.8047 6.19525C13.9298 6.32028 14 6.48985 14 6.66666C14 6.84347 13.9298 7.01304 13.8047 7.13806L10.4714 10.4714C10.2111 10.7317 9.78895 10.7317 9.5286 10.4714C9.26825 10.211 9.26825 9.78893 9.5286 9.52859L11.7239 7.33332L5.33333 7.33332C4.22876 7.33332 3.33333 8.22875 3.33333 9.33332V12.6667C3.33333 13.0348 3.03486 13.3333 2.66667 13.3333C2.29848 13.3333 2 13.0348 2 12.6667V9.33332C2 7.49237 3.49238 5.99999 5.33333 5.99999L11.7239 5.99999L9.5286 3.80473C9.26825 3.54438 9.26825 3.12227 9.5286 2.86192Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PencilIcon({ nibColor }: { nibColor: string }) {
  return (
    <svg
      width="19"
      height="95"
      viewBox="0 0 19 95"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: 19, height: 75 }}
    >
      {/* Body */}
      <path
        d="M13 94.6613C16.3137 94.6613 19 91.022 19 86.5327V30.1617C19 29.9819 18.9736 29.804 18.9223 29.6382L9.96117 0.657966C9.7898 0.103761 9.2102 0.103761 9.03883 0.657966L0.0776615 29.6382C0.0264001 29.804 0 29.9819 0 30.1617V86.5327C0 91.022 2.68629 94.6613 6 94.6613H13Z"
        fill="url(#pencil_body)"
      />
      {/* Nib (dynamic color) */}
      <path
        d="M6.76855 8L9.03174 0.428119C9.19882 -0.14385 9.79674 -0.142342 9.96225 0.430467L12.2314 8H6.76855Z"
        fill={nibColor}
      />
      {/* Grip band */}
      <path
        d="M4.28426 32.7035L0.732873 30.1713C0.399918 29.9339 0 30.261 0 30.7707V89.5809C0 92.5738 1.79086 95 4 95H15C17.2091 95 19 92.5738 19 89.5809V30.7707C19 30.261 18.6001 29.9339 18.2671 30.1713L14.7157 32.7035C14.4242 32.9114 14.0758 32.9114 13.7843 32.7035L9.96575 29.9808C9.67421 29.7729 9.3258 29.7729 9.03426 29.9808L5.21576 32.7035C4.92422 32.9114 4.5758 32.9114 4.28426 32.7035Z"
        fill="url(#pencil_grip)"
      />
      {/* Stripes */}
      <path d="M4.5 33.0356H4.75V95H4.5V33.0356Z" fill="#BABABA" />
      <path d="M14.125 33.0356H14.375V95H14.125V33.0356Z" fill="#BABABA" />
      <defs>
        <linearGradient
          id="pencil_body"
          x1="19"
          y1="47.5"
          x2="0"
          y2="47.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#E1E1E1" />
          <stop offset="0.158654" stopColor="#CDCDCD" />
          <stop offset="0.677885" stopColor="#FEFEFE" />
          <stop offset="1" stopColor="#F2F2F2" />
        </linearGradient>
        <linearGradient
          id="pencil_grip"
          x1="19"
          y1="35.625"
          x2="0"
          y2="35.625"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#6F6F6F" />
          <stop offset="0.322115" stopColor="#AFAFAF" />
          <stop offset="0.841346" stopColor="#AFAFAF" />
          <stop offset="1" stopColor="#D2D2D2" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function MarkerIcon({ nibColor }: { nibColor: string }) {
  return (
    <svg
      width="30"
      height="95"
      viewBox="0 0 30 95"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: 24, height: 70 }}
    >
      {/* Body */}
      <path
        d="M30 31.6667V86.9149C30 91.3802 26.4183 95 22 95H8C3.58172 95 0 91.3802 0 86.9149V31.6667H30Z"
        fill="url(#marker_body)"
      />
      {/* Mid section */}
      <path
        d="M18.6086 9.09574L19.8295 10.4423C20.8956 30.8008 30 30.7531 30 30.7531V31.6667H0V30.7531C0 30.7531 9.10084 30.8008 10.1705 10.4423L11.3914 9.09574H18.6086Z"
        fill="url(#marker_mid)"
      />
      {/* Nib / chisel tip (dynamic color) */}
      <path
        d="M18.6667 9.09574V0L11.3333 3.82596V9.09574H18.6667Z"
        fill={nibColor}
      />
      {/* Nib accent (darker shade) */}
      <path
        d="M11.3333 5.05319L18.6667 0L11.3333 3.73585V5.05319Z"
        fill={nibColor}
        opacity="0.6"
      />
      <defs>
        <linearGradient
          id="marker_body"
          x1="30"
          y1="35.625"
          x2="0"
          y2="35.625"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#6F6F6F" />
          <stop offset="0.322115" stopColor="#AFAFAF" />
          <stop offset="0.841346" stopColor="#AFAFAF" />
          <stop offset="1" stopColor="#D2D2D2" />
        </linearGradient>
        <linearGradient
          id="marker_mid"
          x1="30"
          y1="47.5"
          x2="0"
          y2="47.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#E1E1E1" />
          <stop offset="0.158654" stopColor="#CDCDCD" />
          <stop offset="0.677885" stopColor="#FEFEFE" />
          <stop offset="1" stopColor="#F2F2F2" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function EraserIcon({ brandColor }: { brandColor: string }) {
  const light = lightenHex(brandColor, 0.35);
  return (
    <svg
      width="40"
      height="79"
      viewBox="0 0 40 79"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: 32, height: 55 }}
    >
      <rect
        x="0.5"
        y="0.5"
        width="39"
        height="78"
        rx="12"
        fill="url(#eraser_top)"
      />
      <path
        d="M0.5 39.5H39.5V66.5C39.5 73.1274 34.1274 78.5 27.5 78.5H12.5C5.87258 78.5 0.5 73.1274 0.5 66.5V39.5Z"
        fill="url(#eraser_body)"
      />
      <g filter="url(#eraser_blur)">
        <path
          d="M0.5 8.625C0.5 4.13769 4.13769 0.5 8.625 0.5H31.375C35.8623 0.5 39.5 4.13769 39.5 8.625V8.625C39.5 11.6165 37.0749 14.0417 34.0833 14.0417H5.91666C2.92512 14.0417 0.5 11.6165 0.5 8.625V8.625Z"
          fill={light}
        />
      </g>
      <defs>
        <filter
          id="eraser_blur"
          x="0"
          y="0"
          width="40"
          height="14.5417"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="0.25"
            result="effect1_foregroundBlur"
          />
        </filter>
        <linearGradient
          id="eraser_top"
          x1="39.5"
          y1="39.5"
          x2="0.5"
          y2="39.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={light} />
          <stop offset="0.120192" stopColor={brandColor} />
          <stop offset="0.879808" stopColor={brandColor} />
          <stop offset="1" stopColor={light} />
        </linearGradient>
        <linearGradient
          id="eraser_body"
          x1="39.5"
          y1="54.32"
          x2="0.5"
          y2="54.32"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#E1E1E1" />
          <stop offset="0.12" stopColor="#CDCDCD" />
          <stop offset="0.88" stopColor="#CDCDCD" />
          <stop offset="1" stopColor="#E1E1E1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const PENCIL_SIZE_PATHS = [
  { viewBox: "0 0 13 3", d: "M0.5 2.45636C5.16858 -3.31306 10.0343 6.02902 12.5 0.894409", strokeWidth: 1 },
  { viewBox: "0 0 14 4", d: "M1 2.95636C5.66858 -2.81306 10.5343 6.52902 13 1.39441", strokeWidth: 2 },
  { viewBox: "0 0 15 5", d: "M1.5 3.45636C6.16858 -2.31306 11.0343 7.02902 13.5 1.89441", strokeWidth: 3 },
] as const;

function PencilSizeIcon({ index, color }: { index: number; color: string }) {
  const p = PENCIL_SIZE_PATHS[index];
  return (
    <svg
      width={p.viewBox.split(" ")[2]}
      height={p.viewBox.split(" ")[3]}
      viewBox={p.viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={p.d} stroke={color} strokeWidth={p.strokeWidth} strokeLinecap="round" />
    </svg>
  );
}
