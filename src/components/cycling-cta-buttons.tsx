"use client";

import { useRef, useEffect, useCallback } from "react";

const buttons = [
  {
    label: "Book a demo",
    className:
      "rounded-full bg-gradient-to-r from-[#D946EF] to-[#EC4899] text-white",
    fontFamily: "'Georgia', serif",
  },
  {
    label: "Start your free trial",
    className: "rounded-none bg-[#14141F] text-white",
    fontFamily: "system-ui, sans-serif",
  },
  {
    label: "Schedule a call",
    className: "rounded-lg bg-[#2563EB] text-white",
    fontFamily: "'Courier New', monospace",
  },
];

const INTERVAL_MS = 120;

export function CyclingCtaButtons() {
  const spanRef = useRef<HTMLSpanElement>(null);
  const indexRef = useRef(0);
  const lastTimeRef = useRef(0);

  const tick = useCallback((time: number) => {
    if (time - lastTimeRef.current >= INTERVAL_MS) {
      lastTimeRef.current = time;
      indexRef.current = (indexRef.current + 1) % buttons.length;
      const button = buttons[indexRef.current];
      const el = spanRef.current;
      if (el) {
        el.textContent = button.label;
        el.className = `inline-block px-6 py-2.5 text-[14px] font-medium ${button.className}`;
        el.style.fontFamily = button.fontFamily;
      }
    }
    requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [tick]);

  const button = buttons[0];

  return (
    <div className="h-[44px]">
      <span
        ref={spanRef}
        className={`inline-block px-6 py-2.5 text-[14px] font-medium ${button.className}`}
        style={{ fontFamily: button.fontFamily }}
      >
        {button.label}
      </span>
    </div>
  );
}
