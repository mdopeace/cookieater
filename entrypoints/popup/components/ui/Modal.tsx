import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { FiX } from "react-icons/fi";
import Button from "./Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
}: ModalProps) {
  const [show, setShow] = useState(isOpen);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      setAnimating(false);
    } else if (show) {
      setAnimating(true);
      const t = setTimeout(() => {
        setShow(false);
        setAnimating(false);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={`absolute inset-0 transition-opacity duration-200 ${animating ? "opacity-0" : "opacity-100"}`}
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />
      <div
        className={`relative bg-white rounded-xl shadow-xl w-[90%] max-w-md max-h-[80vh] flex flex-col transition-all duration-200
          ${animating ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <FiX size={18} />
          </button>
        </div>
        <div className="px-4 py-3 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
