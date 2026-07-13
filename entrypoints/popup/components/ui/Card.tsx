import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  pending?: boolean;
  className?: string;
}

export default function Card({
  children,
  pending,
  className = "",
}: CardProps) {
  return (
    <div
      className={`rounded-xl bg-white border transition-colors
        ${pending ? "border-biscuit-400 border-dashed" : "border-gray-200"}
        ${className}`}
    >
      {children}
    </div>
  );
}
