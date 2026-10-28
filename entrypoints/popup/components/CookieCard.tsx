import { useState } from "react";
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
  onRemove: (id: string) => void;
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

  const handleRemove = () => {
    setRemoving(true);
    setTimeout(() => onRemove(cookie.localId), 300);
  };

  return (
    <div
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
          >
            <FiChevronRight
              size={14}
              className={`transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
            />
          </button>

          <div className="cookie-fields">
            <Input
              value={cookie.name}
              onChange={(e) => onUpdate(cookie.localId, { name: e.target.value })}
              placeholder="Name"
              aria-label="Cookie name"
            />
            <Input
              value={cookie.value}
              onChange={(e) => onUpdate(cookie.localId, { value: e.target.value })}
              placeholder="Value"
              aria-label="Cookie value"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onSave(cookie.localId)}
              disabled={!isDirty || saving}
              className={`cookie-icon-action ${isDirty && !saving ? "cookie-save-ready" : ""}`}
              title="Save cookie"
              aria-label={`Save ${cookie.name || "cookie"}`}
            >
              <FiSave size={15} />
            </button>
            <button
              onClick={handleRemove}
              className="cookie-icon-action cookie-delete"
              title="Delete cookie"
              aria-label={`Delete ${cookie.name || "cookie"}`}
            >
              <FiTrash2 size={15} />
            </button>
          </div>
        </div>

        <div
          className={`grid transition-all duration-300 ease-in-out ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
        >
          <div className="overflow-hidden min-h-0">
            <AdvancedFields cookie={cookie} onChange={onUpdate} />
          </div>
        </div>
      </Card>
    </div>
  );
}
