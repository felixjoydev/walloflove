import { GeistMono } from "geist/font/mono";

type StatusVariant = "success" | "error" | "warning";

const variantClasses: Record<StatusVariant, string> = {
  success: "bg-success-bg text-success-text",
  error: "bg-error-bg text-error-text",
  warning: "bg-warning-bg text-warning-text",
};

interface StatusBadgeProps {
  variant: StatusVariant;
  children: React.ReactNode;
}

export function StatusBadge({ variant, children }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex h-[24px] items-center justify-center rounded-icon px-[8px] text-[12px] uppercase ${GeistMono.className} ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
