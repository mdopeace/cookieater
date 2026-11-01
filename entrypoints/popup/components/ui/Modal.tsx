import { useEffect, useRef, useState } from "react";
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
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
      setShow(true);
      setAnimating(false);
      requestAnimationFrame(() => panelRef.current?.focus());
    } else if (show) {
      setAnimating(true);
      const t = setTimeout(() => {
        setShow(false);
        setAnimating(false);
      }, 200);
      return () => clearTimeout(t);
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && !show && previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen, show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={`modal-backdrop absolute inset-0 transition-opacity duration-200 ${animating ? "opacity-0" : "opacity-100"}`}
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            onClose();
          }
          if (event.key !== "Tab") return;

          const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
          );
          if (!focusable?.length) {
            event.preventDefault();
            panelRef.current?.focus();
            return;
          }

          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
        className={`modal-panel relative w-[90%] max-w-md max-h-[80vh] flex flex-col transition-all duration-200
          ${animating ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
      >
        <div className="modal-header flex items-center justify-between px-4 py-3">
          <h2 id="modal-title" className="modal-title text-sm font-semibold">{title}</h2>
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
