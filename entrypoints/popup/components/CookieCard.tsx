import { useRef, useState } from "react";
import { FiSave, FiTrash2, FiChevronRight } from "react-icons/fi";
import Card from "./ui/Card";
import Input from "./ui/Input";
import AdvancedFields from "./AdvancedFields";
import type { CookieItem } from "../types";

interface CookieCardProps {
  cookie: CookieItem;
  isDirty: boolean;
  isNew: boolean;
  saving: boolean;
  onUpdate: (id: string, updates: Partial<CookieItem>) => void;
  onRemove: (id: string) => Promise<boolean>;
  onSave: (id: string) => void;
}

export default function CookieCard({
  cookie,
  isDirty,
  isNew,
  saving,
  onUpdate,
  onRemove,
  onSave,
}: CookieCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [removing, setRemoving] = useState(false);
  const articleRef = useRef<HTMLElement>(null);

  const handleRemove = () => {
    setRemoving(true);
    const article = articleRef.current;
    const focusTarget =
      article?.nextElementSibling?.querySelector<HTMLElement>("input, button") ??
      article?.previousElementSibling?.querySelector<HTMLElement>("input, button") ??
      document.getElementById("add-cookie-button");
    setTimeout(async () => {
      if (!(await onRemove(cookie.localId))) {
        setRemoving(false);
      } else {
        focusTarget?.focus();
      }
    }, 300);
  };

  return (
    <article
      ref={articleRef}
      role="listitem"
      aria-label={`Cookie: ${cookie.name || "new cookie"}${isDirty ? ", unsaved changes" : ""}`}
      className={`transition-all duration-200 ease-in-out
        ${removing ? "opacity-0 scale-95" : "opacity-100 scale-100"}
        ${isNew ? "animate-slide-down" : ""}`}
    >
      <Card pending={isDirty} className={isNew ? "cookie-card-new" : ""}>
        <div className="cookie-main-row">
          <button
            onClick={() => setExpanded(!expanded)}
            className="cookie-expand"
            aria-label={`${expanded ? "Collapse" : "Expand"} ${cookie.name || "cookie"} details`}
            aria-expanded={expanded}
            aria-controls={`cookie-details-${cookie.localId}`}
          >
            <FiChevronRight
              size={14}
              className={`transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
              aria-hidden="true"
            />
          </button>

          <div className="cookie-fields">
            <Input
              id={`cookie-name-${cookie.localId}`}
              value={cookie.name}
              onChange={(e) => onUpdate(cookie.localId, { name: e.target.value })}
              placeholder="Name"
              aria-label={`${cookie.name || "New cookie"} name`}
            />
            <Input
              value={cookie.value}
              onChange={(e) => onUpdate(cookie.localId, { value: e.target.value })}
              placeholder="Value"
              aria-label={`${cookie.name || "New cookie"} value`}
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onSave(cookie.localId)}
              disabled={!isDirty || saving}
              className={`cookie-icon-action ${isDirty && !saving ? "cookie-save-ready" : ""}`}
              aria-label={`Save ${cookie.name || "cookie"}`}
            >
              <FiSave size={15} aria-hidden="true" />
            </button>
            <button
              onClick={handleRemove}
              className="cookie-icon-action cookie-delete"
              aria-label={`Delete ${cookie.name || "cookie"}`}
            >
              <FiTrash2 size={15} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div
          id={`cookie-details-${cookie.localId}`}
          role="region"
          aria-label={`${cookie.name || "Cookie"} settings`}
          aria-hidden={!expanded}
          inert={!expanded}
          className={`grid transition-all duration-300 ease-in-out ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
        >
          <div className="overflow-hidden min-h-0">
            <AdvancedFields cookie={cookie} onChange={onUpdate} />
          </div>
        </div>
      </Card>
    </article>
  );
}
