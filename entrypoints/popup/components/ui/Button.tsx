import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-biscuit-500 text-white hover:bg-biscuit-600 active:bg-biscuit-700",
  secondary:
    "bg-white text-biscuit-700 border border-biscuit-300 hover:bg-biscuit-50 active:bg-biscuit-100",
  danger:
    "bg-red-500 text-white hover:bg-red-600 active:bg-red-700",
  ghost:
    "text-gray-600 hover:bg-gray-100 active:bg-gray-200",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-2 py-1 text-xs gap-1",
  md: "px-3 py-1.5 text-sm gap-1.5",
  lg: "px-4 py-2 text-sm gap-2",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  loading?: boolean;
}

export default function Button({
  variant = "primary",
  size = "md",
  icon,
  loading,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
        ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4" fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : icon ? (
        <span className="text-[1.1em]">{icon}</span>
      ) : null}
      {children && <span>{children}</span>}
    </button>
  );
}
