"use client";

import { useId } from "react";
import { motion } from "motion/react";

export function InlineFollowers() {
  const uid = useId();
  const bgId = `followers-bg${uid}`;
  return (
    <motion.span
      className="inline-block align-middle"
      animate={{
        scale: [1, 1.2, 1, 1.15, 1, 1, 1],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
        times: [0, 0.1, 0.2, 0.3, 0.45, 0.5, 1],
      }}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="20" cy="20" r="19" fill={`url(#${bgId})`} stroke="#FFB9D5" strokeWidth="2" />
        <path d="M30 16.6667V21.1111H29.0909V22H28.1818V22.8889H27.2727V23.7778H26.3636V24.6667H25.4545V25.5556H24.5455V26.4444H23.6364V27.3333H22.7273V28.2222H21.8182V29.1111H20.9091V30H19.0909V29.1111H18.1818V28.2222H17.2727V27.3333H16.3636V26.4444H15.4545V25.5556H14.5455V24.6667H13.6364V23.7778H12.7273V22.8889H11.8182V22H10.9091V21.1111H10V16.6667H10.9091V15.7778H11.8182V14.8889H12.7273V14H18.1818V14.8889H19.0909V15.7778H20.9091V14.8889H21.8182V14H27.2727V14.8889H28.1818V15.7778H29.0909V16.6667H30Z" fill="#FF579D" />
        <defs>
          <linearGradient id={bgId} x1="20" y1="0" x2="20" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFE6F0" />
            <stop offset="1" stopColor="#F9C7DB" />
          </linearGradient>
        </defs>
      </svg>
    </motion.span>
  );
}
