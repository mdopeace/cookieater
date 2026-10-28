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
        className={`modal-backdrop absolute inset-0 transition-opacity duration-200 ${animating ? "opacity-0" : "opacity-100"}`}
        onClick={onClose}
      />
      <div
        className={`modal-panel relative w-[90%] max-w-md max-h-[80vh] flex flex-col transition-all duration-200
          ${animating ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
      >
        <div className="modal-header flex items-center justify-between px-4 py-3">
          <h2 className="modal-title text-sm font-semibold">{title}</h2>
          <button onClick={onClose} className="modal-close" aria-label="Close dialog">
            <FiX size={18} />
          </button>
        </div>
        <div className="px-4 py-3 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="modal-footer px-4 py-3 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
