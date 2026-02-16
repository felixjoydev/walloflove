import type { DrawingData } from "@shared/types/drawing";
import getStroke from "perfect-freehand";

function getSvgPathFromStroke(points: number[][]): string {
  if (points.length < 2) return "";

  const d: string[] = [];
  d.push(`M ${Math.round(points[0][0])} ${Math.round(points[0][1])}`);

  for (let i = 1; i < points.length - 1; i++) {
    const mx = Math.round((points[i][0] + points[i + 1][0]) / 2);
    const my = Math.round((points[i][1] + points[i + 1][1]) / 2);
    d.push(
      `Q ${Math.round(points[i][0])} ${Math.round(points[i][1])} ${mx} ${my}`
    );
  }

  const last = points[points.length - 1];
  d.push(`L ${Math.round(last[0])} ${Math.round(last[1])}`);
  d.push("Z");

  return d.join(" ");
}

export function strokeDataToSvg(data: DrawingData): string {
  const { width, height, strokes } = data;
  const paths = strokes.map((stroke) => {
    const outline = getStroke(
      stroke.points.map(([x, y, p]) => [x, y, p]),
      {
        size: stroke.size,
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5,
        simulatePressure: true,
      }
    );
    const d = getSvgPathFromStroke(outline);
    return `<path d="${d}" fill="${stroke.color}" />`;
  });

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`,
    ...paths,
    "</svg>",
  ].join("");
}

export function strokeDataToDataUri(data: DrawingData): string {
  const svg = strokeDataToSvg(data);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
