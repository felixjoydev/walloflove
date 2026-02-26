"use client";

import { useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";

const BUTTON_TEXT = "Create your guestbook";
const LETTER_DELAY = 0.06;

export function CreativeGuestbookButton() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href="/signup" className="inline-block">
      <motion.div
        className="relative flex items-center justify-center overflow-hidden rounded-input px-6 py-3 cursor-pointer"
        style={{
          background: "linear-gradient(to top, #e6e6e6, white)",
          boxShadow:
            "0px 1px 3px 0px rgba(0,0,0,0.13), 0px 0px 0px 1px rgba(0,0,0,0.08), 0px 7px 20px -5px rgba(0,0,0,0.1), 0px 6px 14px -5px rgba(0,0,0,0.14)",
        }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        {/* Rainbow gradient glow (background — animates on hover) */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[60%] pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, #FF5159 0%, #D048FF 20%, #6C73FF 40%, #407CFF 60%, #54FF9C 80%, #C1EA68 100%)",
            filter: "blur(12px)",
          }}
          animate={
            isHovered
              ? {
                  opacity: 0.6,
                  filter: [
                    "blur(12px) hue-rotate(0deg)",
                    "blur(12px) hue-rotate(360deg)",
                  ],
                }
              : { opacity: 0.3, filter: "blur(12px) hue-rotate(0deg)" }
          }
          transition={
            isHovered
              ? {
                  opacity: { duration: 0.3 },
                  filter: { duration: 4, ease: "linear", repeat: Infinity },
                }
              : { duration: 0.4 }
          }
        />

        {/* Text — per-letter shimmer+glow via motion */}
        <span className="relative z-10 font-semibold text-body-sm tracking-tight">
          {BUTTON_TEXT.split("").map((char, i) => (
            <motion.span
              key={i}
              animate={
                isHovered
                  ? {
                      color: "#3f3f3f",
                      textShadow: "0px 0.5px 0px white",
                    }
                  : {
                      color: [
                        "#3f3f3f",
                        "#b5b5b5",
                        "#3f3f3f",
                        "#3f3f3f",
                      ],
                      textShadow: [
                        "0 0 0px rgba(255,255,255,0)",
                        "0 0 2px rgba(255,255,255,0.7)",
                        "0 0 0px rgba(255,255,255,0)",
                        "0 0 0px rgba(255,255,255,0)",
                      ],
                    }
              }
              transition={
                isHovered
                  ? { duration: 0.3 }
                  : {
                      duration: 1.4,
                      delay: i * LETTER_DELAY,
                      repeat: Infinity,
                      ease: "linear",
                      times: [0, 0.08, 0.17, 1],
                    }
              }
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </span>

        {/* Inner highlight (glossy inset borders) */}
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none"
          style={{
            boxShadow:
              "inset 0px -1.5px 0px 0px rgba(255,255,255,0.45), inset 0px 1.5px 0px 0px rgba(255,255,255,0.45)",
          }}
        />
      </motion.div>
    </Link>
  );
}
