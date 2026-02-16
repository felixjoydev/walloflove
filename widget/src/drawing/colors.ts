export const PEN_COLORS = [
  "#1a1a1a", // black
  "#6b7280", // dark gray
  "#2563eb", // blue
  "#dc2626", // red
  "#16a34a", // green
  "#9333ea", // purple
  "#ea580c", // orange
  "#ec4899", // pink
] as const;

export const PEN_SIZES = [
  { label: "Thin", value: 4 },
  { label: "Medium", value: 8 },
  { label: "Thick", value: 14 },
] as const;

export type PenColor = (typeof PEN_COLORS)[number];
export type PenSize = (typeof PEN_SIZES)[number]["value"];
