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
      className={`cookie-card ${pending ? "cookie-card-pending" : ""}
        ${className}`}
    >
      {children}
    </div>
  );
}
