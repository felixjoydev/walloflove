export function SketchyStrike({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block">
      {children}
      <svg
        className="absolute left-0 top-1/2 -translate-y-1/2 w-full pointer-events-none"
        height="8"
        viewBox="0 0 100 8"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 5 Q8 2 16 5 Q24 8 32 4 Q40 1 48 5 Q56 8 64 4 Q72 1 80 5 Q88 8 96 4 L100 5"
          stroke="#E25D5D"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </span>
  );
}
