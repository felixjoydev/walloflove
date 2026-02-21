export const PEN_COLORS = [
  "#1a1a1a", // black
  "#2563eb", // blue
  "#dc2626", // red
  "#16a34a", // green
  "#9333ea", // purple
  "#ea580c", // orange
] as const;

export const PEN_SIZES = [
  { label: "S", value: 4 },
  { label: "M", value: 8 },
  { label: "L", value: 14 },
] as const;

export const MARKER_SIZE = 20;
export const ERASER_SIZE = 24;
export const MARKER_OPACITY = 0.5;

export const DEFAULT_COLOR = PEN_COLORS[0];
export const DEFAULT_SIZE = PEN_SIZES[1].value;

export type Tool = "pencil" | "marker" | "eraser";
export type PenColor = (typeof PEN_COLORS)[number];
export type PenSize = (typeof PEN_SIZES)[number]["value"];
