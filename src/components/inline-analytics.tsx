"use client";

import { useId } from "react";
import { motion } from "motion/react";

function AnimatedBar({ d, durations }: { d: string; durations: number[] }) {
  return (
    <motion.path
      d={d}
      fill="#2A60BD"
      animate={{
        scaleY: durations,
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{
        transformOrigin: "50% 100%",
        transformBox: "fill-box",
      }}
    />
  );
}

export function InlineAnalytics() {
  const uid = useId();
  const bgId = `analytics-bg${uid}`;
  return (
    <span className="inline-block align-middle">
      <svg
        width="28"
        height="28"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="1" y="1" width="38" height="38" rx="11" fill={`url(#${bgId})`} stroke="#B9D3FF" strokeWidth="2" />
        {/* Bar 1 — short */}
        <AnimatedBar
          d="M12.1074 20.9552L13.1074 20.9552L13.1074 28.8124L12.1074 28.8124L12.1074 30.3838L10.1074 30.3838L10.1074 28.8124L9.10742 28.8124L9.10742 20.9552L10.1074 20.9552L10.1074 19.3838L12.1074 19.3838L12.1074 20.9552Z"
          durations={[1, 0.5, 1, 1.3, 0.7, 1]}
        />
        {/* Bar 2 — tall */}
        <AnimatedBar
          d="M18.1074 12.9669L19.1074 12.9669L19.1074 28.8002L18.1074 28.8002L18.1074 30.3835L16.1074 30.3835L16.1074 28.8002L15.1074 28.8002L15.1074 12.9669L16.1074 12.9669L16.1074 11.3835L18.1074 11.3835L18.1074 12.9669Z"
          durations={[1, 0.7, 1, 0.4, 1.1, 1]}
        />
        {/* Bar 3 — medium */}
        <AnimatedBar
          d="M24.1074 19.0088L25.1074 19.0088L25.1074 28.7588L24.1074 28.7588L24.1074 30.3838L22.1074 30.3838L22.1074 28.7588L21.1074 28.7588L21.1074 19.0088L22.1074 19.0088L22.1074 17.3838L24.1074 17.3838L24.1074 19.0088Z"
          durations={[1, 1.4, 0.6, 1, 0.8, 1]}
        />
        {/* Bar 4 — tall */}
        <AnimatedBar
          d="M30.1074 12.9671L31.1074 12.9671L31.1074 28.8005L30.1074 28.8005L30.1074 30.3838L28.1074 30.3838L28.1074 28.8005L27.1074 28.8005L27.1074 12.9671L28.1074 12.9671L28.1074 11.3838L30.1074 11.3838L30.1074 12.9671Z"
          durations={[1, 0.6, 1.2, 0.5, 1, 1]}
        />
        <defs>
          <linearGradient id={bgId} x1="20" y1="0" x2="20" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E6F5FF" />
            <stop offset="1" stopColor="#C7E0F9" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}
