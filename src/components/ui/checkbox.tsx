export function Checkbox({
  checked,
  onChange,
  variant = "default",
  className = "",
}: {
  checked: boolean;
  onChange: () => void;
  variant?: "default" | "white";
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`w-[16px] h-[16px] shrink-0 flex items-center justify-center rounded-[4px] border transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent ${
        checked
          ? "bg-accent border-accent"
          : variant === "white"
            ? "bg-white border-border hover:border-text-placeholder"
            : "bg-bg-input border-border hover:border-text-placeholder"
      } ${className}`}
    >
      {checked && (
        <svg className="w-[10px] h-[10px] text-white" viewBox="0 0 10 10" fill="none">
          <path
            d="M2 5L4.5 7.5L8 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
