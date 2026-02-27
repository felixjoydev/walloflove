"use client";

import { motion } from "motion/react";

export function AnimatedGradientText({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.span
      className="italic bg-clip-text text-transparent pr-2"
      style={{
        backgroundImage:
          "linear-gradient(90deg, #FF5159 0%, #D048FF 20.22%, #6C73FF 40.44%, #407CFF 60.11%, #54FF9C 79.78%, #C1EA68 100%)",
      }}
      animate={{
        filter: [
          "hue-rotate(0deg)",
          "hue-rotate(360deg)",
        ],
      }}
      transition={{
        duration: 6,
        ease: "linear",
        repeat: Infinity,
      }}
    >
      {children}
    </motion.span>
  );
}
