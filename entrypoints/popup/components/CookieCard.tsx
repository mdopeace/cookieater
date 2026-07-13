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
      className={`transition-all duration-300 ease-in-out
        ${removing ? "opacity-0 scale-95" : "opacity-100 scale-100"}
        ${isNew ? "animate-[slideDown_0.35s_ease-out]" : ""}`}
    >
      <Card pending={isDirty} className={isNew ? "ring-2 ring-biscuit-300" : ""}>
        <div className="flex items-center gap-2 px-4 py-2.5">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <FiChevronRight
              size={14}
              className={`transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
            />
          </button>

          <div className="flex-1 grid grid-cols-2 gap-2">
            <Input
              value={cookie.name}
              onChange={(e) => onUpdate(cookie.localId, { name: e.target.value })}
              placeholder="Name"
            />
            <Input
              value={cookie.value}
              onChange={(e) => onUpdate(cookie.localId, { value: e.target.value })}
              placeholder="Value"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onSave(cookie.localId)}
              disabled={!isDirty || saving}
              className={`transition-all duration-200 ease-in-out cursor-pointer disabled:cursor-not-allowed
                ${isDirty && !saving
                  ? "opacity-100 text-biscuit-500 hover:text-biscuit-700"
                  : "opacity-40 text-gray-400"}`}
              title="Save cookie"
            >
              <FiSave size={15} />
            </button>
            <button
              onClick={handleRemove}
              className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
              title="Delete cookie"
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
