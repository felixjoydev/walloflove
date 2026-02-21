import type { DrawingData } from "@shared/types";
import { MAX_STROKE_DATA_SIZE, MAX_STROKES, MAX_POINTS_TOTAL } from "@shared/types";

/**
 * Strip HTML tags from a string.
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/**
 * Validate that a link is HTTPS-only. Rejects javascript:, data:, relative URLs.
 */
export function isValidLink(link: string): boolean {
  try {
    const url = new URL(link);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validate stroke data structure and enforce size limits.
 */
export function validateStrokeData(data: unknown): data is DrawingData {
  if (!data || typeof data !== "object") return false;

  const d = data as Record<string, unknown>;
  if (d.version !== 1) return false;
  if (typeof d.width !== "number" || typeof d.height !== "number") return false;
  if (!Array.isArray(d.strokes)) return false;
  if (d.strokes.length > MAX_STROKES) return false;

  // Check total size
  const jsonSize = new TextEncoder().encode(JSON.stringify(data)).length;
  if (jsonSize > MAX_STROKE_DATA_SIZE) return false;

  // Count total points and validate structure
  let totalPoints = 0;
  for (const stroke of d.strokes) {
    if (!stroke || typeof stroke !== "object") return false;
    if (!Array.isArray(stroke.points)) return false;
    if (typeof stroke.color !== "string") return false;
    if (typeof stroke.size !== "number") return false;
    if (stroke.tool !== undefined && !["pencil", "marker", "eraser"].includes(stroke.tool)) return false;
    if (stroke.opacity !== undefined && (typeof stroke.opacity !== "number" || stroke.opacity < 0 || stroke.opacity > 1)) return false;

    totalPoints += stroke.points.length;
    if (totalPoints > MAX_POINTS_TOTAL) return false;

    for (const point of stroke.points) {
      if (!Array.isArray(point) || point.length !== 3) return false;
      if (point.some((v: unknown) => typeof v !== "number")) return false;
    }
  }

  return true;
}
