"use client";

import { motion } from "motion/react";

export function InlineGrowUp() {
  // 28px base → 32px (scale ~1.14) → 36px (scale ~1.29)
  return (
    <motion.span
      className="inline-block origin-bottom-left"
      animate={{
        scale: [1, 1.14, 1.29, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
        times: [0, 0.35, 0.7, 0.7],
      }}
    >
      up.
    </motion.span>
  );
}
