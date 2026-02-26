"use client";

import { useEffect, useRef, useCallback } from "react";

// Simple flower: 5 petals + center circle + stem, all as strokes
const PETALS = [
  // 5 petals around center (elliptical arcs)
  "M14,8 C14,4 18,2 20,5 C22,8 18,10 14,8Z",
  "M14,8 C11,5 12,1 15,1 C18,1 17,5 14,8Z",
  "M14,8 C10,6 7,3 10,1.5 C13,0 13,5 14,8Z",
  "M14,8 C10,7 6,6 7,3.5 C8,1 12,4 14,8Z",
  "M14,8 C12,10 8,9 8,6 C8,3 12,5 14,8Z",
];
const CENTER = { cx: 14, cy: 7, r: 2 };
const STEM = "M14,10 C14,14 13,18 12,22";
const LEAF = "M12,18 C9,16 8,18 10,20";

const ALL_PATHS = [...PETALS, STEM, LEAF];
const DRAW_DURATION = 2000; // ms total to draw
const HOLD_DURATION = 1500; // ms to hold complete
const FADE_DURATION = 300;
const TOTAL_CYCLE = DRAW_DURATION + HOLD_DURATION + FADE_DURATION;

export function InlineFlower() {
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const circleRef = useRef<SVGCircleElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const startRef = useRef(0);
  const lengthsRef = useRef<number[]>([]);

  const tick = useCallback((time: number) => {
    if (!startRef.current) startRef.current = time;
    const elapsed = (time - startRef.current) % TOTAL_CYCLE;

    // Calculate lengths on first run
    if (lengthsRef.current.length === 0) {
      lengthsRef.current = pathRefs.current.map(
        (p) => p?.getTotalLength() ?? 100
      );
    }

    const pathCount = ALL_PATHS.length;
    const perPath = DRAW_DURATION / (pathCount + 1); // +1 for center circle

    for (let i = 0; i < pathCount; i++) {
      const el = pathRefs.current[i];
      if (!el) continue;
      const len = lengthsRef.current[i];
      const pathStart = i * perPath;

      if (elapsed < DRAW_DURATION) {
        const pathProgress = Math.max(
          0,
          Math.min(1, (elapsed - pathStart) / perPath)
        );
        el.style.strokeDasharray = String(len);
        el.style.strokeDashoffset = String(len * (1 - pathProgress));
        el.style.opacity = "1";
      } else if (elapsed < DRAW_DURATION + HOLD_DURATION) {
        el.style.strokeDashoffset = "0";
        el.style.opacity = "1";
      } else {
        const fadeProgress =
          (elapsed - DRAW_DURATION - HOLD_DURATION) / FADE_DURATION;
        el.style.opacity = String(1 - fadeProgress);
      }
    }

    // Center circle
    if (circleRef.current) {
      const circleStart = pathCount * perPath;
      if (elapsed < DRAW_DURATION) {
        const circleProgress = Math.max(
          0,
          Math.min(1, (elapsed - circleStart) / perPath)
        );
        circleRef.current.style.opacity = String(circleProgress);
      } else if (elapsed < DRAW_DURATION + HOLD_DURATION) {
        circleRef.current.style.opacity = "1";
      } else {
        const fadeProgress =
          (elapsed - DRAW_DURATION - HOLD_DURATION) / FADE_DURATION;
        circleRef.current.style.opacity = String(1 - fadeProgress);
      }
    }

    requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [tick]);

  return (
    <span className="inline-block align-middle -mx-1">
      <svg
        ref={svgRef}
        width="26"
        height="26"
        viewBox="0 0 28 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {ALL_PATHS.map((d, i) => (
          <path
            key={i}
            ref={(el) => {
              pathRefs.current[i] = el;
            }}
            d={d}
            stroke="#333"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            style={{ strokeDasharray: 100, strokeDashoffset: 100 }}
          />
        ))}
        <circle
          ref={circleRef}
          cx={CENTER.cx}
          cy={CENTER.cy}
          r={CENTER.r}
          fill="#FDCB6E"
          style={{ opacity: 0 }}
        />
      </svg>
    </span>
  );
}
