import type { DrawingData } from "@shared/types/drawing";
import getStroke from "perfect-freehand";

function r(n: number): number {
  return Math.round(n * 10) / 10;
}

function getSvgPathFromStroke(points: number[][]): string {
  if (points.length < 2) return "";

  const d: string[] = [];
  d.push(`M ${r(points[0][0])} ${r(points[0][1])}`);

  for (let i = 1; i < points.length - 1; i++) {
    const mx = r((points[i][0] + points[i + 1][0]) / 2);
    const my = r((points[i][1] + points[i + 1][1]) / 2);
    d.push(`Q ${r(points[i][0])} ${r(points[i][1])} ${mx} ${my}`);
  }

  const last = points[points.length - 1];
  d.push(`L ${r(last[0])} ${r(last[1])}`);
  d.push("Z");

  return d.join(" ");
}

function getStrokeOptions(tool: string, size: number) {
  switch (tool) {
    case "marker":
      return {
        size,
        thinning: 0.1,
        smoothing: 0.8,
        streamline: 0.8,
        simulatePressure: false,
      };
    case "eraser":
      return {
        size,
        thinning: 0,
        smoothing: 0.6,
        streamline: 0.8,
        simulatePressure: false,
      };
    default: // pencil
      return {
        size,
        thinning: 0.4,
        smoothing: 0.8,
        streamline: 0.85,
        simulatePressure: true,
      };
  }
}

let _maskCounter = 0;

export function strokeDataToSvg(
  data: DrawingData,
  colorOverride?: string
): string {
  const { width, height, strokes } = data;
  if (strokes.length === 0) return "";

  const drawPaths: string[] = [];
  const eraserPaths: string[] = [];

  for (const stroke of strokes) {
    const tool = stroke.tool ?? "pencil";
    const opacity = stroke.opacity ?? 1;
    const options = getStrokeOptions(tool, stroke.size);
    const outline = getStroke(
      stroke.points.map(([x, y, p]) => [x, y, p]),
      options
    );
    const d = getSvgPathFromStroke(outline);
    if (!d) continue;

    if (tool === "eraser") {
      eraserPaths.push(`<path d="${d}" fill="black"/>`);
    } else {
      const color = colorOverride ?? stroke.color;
      if (tool === "marker") {
        drawPaths.push(
          `<g opacity="${opacity}"><path d="${d}" fill="${color}"/></g>`
        );
      } else {
        drawPaths.push(`<path d="${d}" fill="${color}"/>`);
      }
    }
  }

  const hasEraser = eraserPaths.length > 0;

  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`,
  ];

  if (hasEraser) {
    const maskId = `em${_maskCounter++}`;
    parts.push("<defs>");
    parts.push(`<mask id="${maskId}">`);
    parts.push(
      `<rect width="${width}" height="${height}" fill="white"/>`
    );
    parts.push(...eraserPaths);
    parts.push("</mask>");
    parts.push("</defs>");
    parts.push(`<g mask="url(#${maskId})">`);
    parts.push(...drawPaths);
    parts.push("</g>");
  } else {
    parts.push(...drawPaths);
  }

  parts.push("</svg>");
  return parts.join("");
}

export function strokeDataToDataUri(data: DrawingData): string {
  const svg = strokeDataToSvg(data);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
