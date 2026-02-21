import type { DrawingData } from "@shared/types/drawing";
import { strokeDataToSvg } from "@/components/canvas/stroke-to-svg";

function isValidDrawingData(data: unknown): data is DrawingData {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    d.version === 1 &&
    typeof d.width === "number" &&
    typeof d.height === "number" &&
    Array.isArray(d.strokes)
  );
}

export function SignatureSvg({
  strokeData,
  className,
  style,
}: {
  strokeData: unknown;
  className?: string;
  style?: React.CSSProperties;
}) {
  if (!isValidDrawingData(strokeData) || strokeData.strokes.length === 0) {
    return (
      <div className={className} style={style}>
        <svg viewBox="0 0 100 40" className="h-full w-full opacity-20">
          <path
            d="M10 30 Q 25 5 40 28 T 70 25 T 90 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  const svg = strokeDataToSvg(strokeData);

  return (
    <div
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
