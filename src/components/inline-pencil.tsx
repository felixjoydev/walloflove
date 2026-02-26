"use client";

import { useEffect, useRef, useCallback, useId } from "react";

const COLORS = [
  "#FF5159", "#D048FF", "#6C73FF", "#407CFF",
  "#26AE5F", "#FF9F43", "#E84393", "#00B894",
  "#FDCB6E", "#6C5CE7", "#E17055", "#00CEC9",
];

const INTERVAL = 400;

export function InlinePencil() {
  const uid = useId();
  const body1Id = `pencil-body-1${uid}`;
  const body2Id = `pencil-body-2${uid}`;
  const nibRef = useRef<SVGPathElement>(null);
  const indexRef = useRef(0);
  const lastRef = useRef(0);

  const tick = useCallback((time: number) => {
    if (time - lastRef.current >= INTERVAL) {
      lastRef.current = time;
      indexRef.current = (indexRef.current + 1) % COLORS.length;
      if (nibRef.current) {
        nibRef.current.setAttribute("fill", COLORS[indexRef.current]);
      }
    }
    requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [tick]);

  return (
    <span className="inline-block align-middle rotate-[20deg]">
      <svg
        width="18"
        height="40"
        viewBox="0 0 19 95"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={body1Id} x1="19" y1="47.5" x2="0" y2="47.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E1E1E1" />
            <stop offset="0.158654" stopColor="#CDCDCD" />
            <stop offset="0.677885" stopColor="#FEFEFE" />
            <stop offset="1" stopColor="#F2F2F2" />
          </linearGradient>
          <linearGradient id={body2Id} x1="19" y1="35.625" x2="0" y2="35.625" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6F6F6F" />
            <stop offset="0.322115" stopColor="#AFAFAF" />
            <stop offset="0.841346" stopColor="#AFAFAF" />
            <stop offset="1" stopColor="#D2D2D2" />
          </linearGradient>
        </defs>
        {/* Body top */}
        <path d="M13 94.6613C16.3137 94.6613 19 91.022 19 86.5327V30.1617C19 29.9819 18.9736 29.804 18.9223 29.6382L9.96117 0.657966C9.7898 0.103761 9.2102 0.103761 9.03883 0.657966L0.0776615 29.6382C0.0264001 29.804 0 29.9819 0 30.1617V86.5327C0 91.022 2.68629 94.6613 6 94.6613H13Z" fill={`url(#${body1Id})`} />
        {/* Nib - animated color */}
        <path ref={nibRef} d="M6.76855 8L9.03174 0.428119C9.19882 -0.14385 9.79674 -0.142342 9.96225 0.430467L12.2314 8H6.76855Z" fill="#494949" />
        {/* Body bottom */}
        <path d="M4.28426 32.7035L0.732873 30.1713C0.399918 29.9339 0 30.261 0 30.7707V89.5809C0 92.5738 1.79086 95 4 95H15C17.2091 95 19 92.5738 19 89.5809V30.7707C19 30.261 18.6001 29.9339 18.2671 30.1713L14.7157 32.7035C14.4242 32.9114 14.0758 32.9114 13.7843 32.7035L9.96575 29.9808C9.67421 29.7729 9.3258 29.7729 9.03426 29.9808L5.21576 32.7035C4.92422 32.9114 4.5758 32.9114 4.28426 32.7035Z" fill={`url(#${body2Id})`} />
        {/* Lines */}
        <path d="M4.5 33.0356H4.75V95H4.5V33.0356Z" fill="#BABABA" />
        <path d="M14.125 33.0356H14.375V95H14.125V33.0356Z" fill="#BABABA" />
      </svg>
    </span>
  );
}
