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
      {label && <label className="field-label">{label}</label>}
      <div className="relative">
        {icon && (
          <span className="input-icon absolute left-2.5 top-1/2 -translate-y-1/2 text-sm">
            {icon}
          </span>
        )}
        <input
          className={`field-input w-full rounded-lg border px-3 py-1.5 text-sm transition-colors outline-none
            ${icon ? "pl-8" : ""}
            ${error ? "field-input-error" : ""} ${className}`}
          {...props}
        />
      </div>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
