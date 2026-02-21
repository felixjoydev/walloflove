import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonSize = "big" | "small";
type ButtonVariant = "primary" | "secondary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize;
  variant?: ButtonVariant;
}

const sizeStyles: Record<ButtonSize, string> = {
  big: "h-[44px] w-full text-body rounded-input",
  small: "h-[36px] px-4 text-body-sm rounded-sm",
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover active:bg-accent-active disabled:opacity-50",
  secondary:
    "bg-bg-card text-text-primary border border-border shadow-card-sm hover:bg-bg-page active:bg-bg-subtle disabled:opacity-50",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ size = "big", variant = "primary", className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`flex items-center justify-center font-semibold transition-colors cursor-pointer ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
