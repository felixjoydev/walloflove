"use client";

import { useEffect, useRef, useCallback } from "react";

const scribblePath =
  "M2 8 Q6 2 10 8 Q14 14 18 6 Q22 -1 26 8 Q30 15 34 6 Q38 -1 42 8 Q46 14 50 6 Q54 0 58 8 Q62 14 66 6 Q70 0 74 8";

const letters = ["B", "o", "o", ".", "."];
const LETTER_DELAY = 150; // ms between each letter
const HOLD_DURATION = 800; // ms to hold full word before restarting
const TOTAL_CYCLE = letters.length * LETTER_DELAY + HOLD_DURATION;

export function ShameAnnotation() {
  return (
    <span className="relative inline-block">
      shame.
      {/* Scribble underline */}
      <svg
        className="absolute left-0 -bottom-2 w-full"
        height="14"
        viewBox="0 0 76 16"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d={scribblePath}
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      {/* "Boo.." typing annotation */}
      <span className="absolute -right-10 -top-3 rotate-[-16deg] font-display text-[16px] text-text-primary">
        <TypingBoo />
      </span>
    </span>
  );
}

function TypingBoo() {
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  const startRef = useRef(0);

  const tick = useCallback((time: number) => {
    if (!startRef.current) startRef.current = time;
    const elapsed = (time - startRef.current) % TOTAL_CYCLE;

    for (let i = 0; i < letters.length; i++) {
      const el = refs.current[i];
      if (!el) continue;
      const threshold = i * LETTER_DELAY;
      el.style.visibility = elapsed >= threshold ? "visible" : "hidden";
    }

    requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [tick]);

  return (
    <span>
      {letters.map((char, i) => (
        <span
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          style={{ visibility: "hidden" }}
        >
          {char}
        </span>
      ))}
    </span>
  );
}
