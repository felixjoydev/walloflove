import type { CSSProperties, ReactNode } from "react";

type MarkerVariant = "highlight" | "highlight-red" | "underline";

// Hand-drawn yellow highlighter SVG (organic wobbly rectangle)
const HIGHLIGHT_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 60' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M8 44 Q3 12 18 14 L182 6 Q198 4 194 36 Q190 54 178 48 L18 54 Q4 56 8 44Z' fill='rgba(255,225,85,0.35)'/%3E%3C/svg%3E")`;

// Hand-drawn subtle red highlighter SVG
const HIGHLIGHT_RED_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 60' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M8 44 Q3 12 18 14 L182 6 Q198 4 194 36 Q190 54 178 48 L18 54 Q4 56 8 44Z' fill='rgba(229,93,93,0.18)'/%3E%3C/svg%3E")`;

// Hand-drawn dark brush underline SVG (organic wavy stroke)
const UNDERLINE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 12' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 8 Q50 2 100 7 Q150 12 198 5' stroke='%2314141F' stroke-width='4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`;

const styles: Record<MarkerVariant, CSSProperties> = {
  highlight: {
    backgroundImage: HIGHLIGHT_SVG,
    backgroundRepeat: "no-repeat",
    backgroundSize: "100% 90%",
    backgroundPosition: "center 60%",
    padding: "0 4px",
  },
  "highlight-red": {
    backgroundImage: HIGHLIGHT_RED_SVG,
    backgroundRepeat: "no-repeat",
    backgroundSize: "100% 90%",
    backgroundPosition: "center 60%",
    padding: "0 4px",
  },
  underline: {
    backgroundImage: UNDERLINE_SVG,
    backgroundRepeat: "no-repeat",
    backgroundSize: "100% 6px",
    backgroundPosition: "center bottom",
    paddingBottom: "4px",
  },
};

export function Marker({
  variant = "highlight",
  children,
}: {
  variant?: MarkerVariant;
  children: ReactNode;
}) {
  return <span style={styles[variant]}>{children}</span>;
}
