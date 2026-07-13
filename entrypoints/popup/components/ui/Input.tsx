import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export default function Input({
  label,
  error,
  icon,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-gray-600">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            {icon}
          </span>
        )}
        <input
          className={`w-full rounded-lg border px-3 py-1.5 text-sm transition-colors outline-none
            ${icon ? "pl-8" : ""}
            ${error ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-biscuit-500"}
            focus:ring-2 focus:ring-biscuit-500/20 ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
