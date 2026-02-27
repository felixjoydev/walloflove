type ActionVariant = "approve" | "reject";

const variantStyles: Record<ActionVariant, string> = {
  approve: "bg-approve hover:opacity-90",
  reject: "bg-reject hover:opacity-90",
};

interface ActionButtonProps {
  variant: ActionVariant;
  onClick: () => void;
  disabled?: boolean;
}

export function ActionButton({ variant, onClick, disabled }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-[32px] h-[32px] rounded-icon flex items-center justify-center cursor-pointer transition-opacity disabled:opacity-50 ${variantStyles[variant]}`}
      title={variant === "approve" ? "Approve" : "Reject"}
    >
      <img
        src={variant === "approve" ? "/check.svg" : "/close.svg"}
        alt={variant === "approve" ? "Approve" : "Reject"}
        className="w-[16px] h-[16px]"
      />
    </button>
  );
}
