/**
 * Normalize an SVG file so it has explicit pixel dimensions and a viewBox.
 * This prevents SVGs from appearing stretched when rendered in <img> tags.
 *
 * Common issues fixed:
 * - viewBox present but width/height are "100%" or missing → derive px from viewBox
 * - width/height in px but no viewBox → add viewBox
 */
export async function normalizeSvgFile(file: File): Promise<File> {
  if (file.type !== "image/svg+xml") return file;

  const text = await file.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "image/svg+xml");
  const svg = doc.querySelector("svg");
  if (!svg) return file;

  const viewBox = svg.getAttribute("viewBox");
  const rawW = svg.getAttribute("width");
  const rawH = svg.getAttribute("height");

  const pxW = parsePx(rawW);
  const pxH = parsePx(rawH);
  const vb = parseViewBox(viewBox);

  if (vb) {
    // Has viewBox — ensure width/height are explicit pixels
    if (!pxW) svg.setAttribute("width", String(vb.w));
    if (!pxH) svg.setAttribute("height", String(vb.h));
  } else if (pxW && pxH) {
    // Has pixel dimensions but no viewBox — add one
    svg.setAttribute("viewBox", `0 0 ${pxW} ${pxH}`);
  } else {
    // No usable dimensions at all — leave unchanged
    return file;
  }

  const serializer = new XMLSerializer();
  const fixed = serializer.serializeToString(doc);
  return new File([fixed], file.name, { type: "image/svg+xml" });
}

/** Parse a value like "48" or "48px" into a number; return null for "100%" or missing */
function parsePx(val: string | null): number | null {
  if (!val) return null;
  if (val.includes("%")) return null;
  const n = parseFloat(val);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Parse "0 0 200 150" into { w: 200, h: 150 } */
function parseViewBox(vb: string | null): { w: number; h: number } | null {
  if (!vb) return null;
  const parts = vb.trim().split(/[\s,]+/).map(Number);
  if (parts.length < 4 || !Number.isFinite(parts[2]) || !Number.isFinite(parts[3])) return null;
  return { w: parts[2], h: parts[3] };
}
