import { useId } from "react";
import type { InputHTMLAttributes, ReactNode, Ref } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelClassName?: string;
  error?: string;
  icon?: ReactNode;
  inputRef?: Ref<HTMLInputElement>;
}

export default function Input({
  label,
  labelClassName = "",
  error,
  icon,
  inputRef,
  id,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  className = "",
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className={`field-label ${labelClassName}`}>
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="input-icon absolute left-2.5 top-1/2 -translate-y-1/2 text-sm">
            {icon}
          </span>
        )}
        <input
          ref={inputRef}
          id={inputId}
          aria-invalid={error ? true : ariaInvalid}
          aria-describedby={error ? `${inputId}-error` : ariaDescribedBy}
          className={`field-input w-full rounded-lg border px-3 py-1.5 text-sm transition-colors outline-none
            ${icon ? "pl-8" : ""}
            ${error ? "field-input-error" : ""} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <span id={`${inputId}-error`} className="field-error">
          {error}
        </span>
      )}
    </div>
  );
}
