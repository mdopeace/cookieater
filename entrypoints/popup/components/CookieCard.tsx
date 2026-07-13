import { useState } from "react";
import { FiTrash2, FiChevronDown, FiChevronRight } from "react-icons/fi";
import Card from "./ui/Card";
import Input from "./ui/Input";
import AdvancedFields from "./AdvancedFields";
import type { CookieItem, PendingChange } from "../types";

interface CookieCardProps {
  cookie: CookieItem;
  change: PendingChange | undefined;
  onUpdate: (id: string, updates: Partial<CookieItem>) => void;
  onRemove: (id: string) => void;
}

export default function CookieCard({
  cookie,
  change,
  onUpdate,
  onRemove,
}: CookieCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isNew = change?.type === "add";
  const isDeleted = change?.type === "delete";
  const isPending = change != null && change.type !== "delete";

  if (isDeleted) return null;

  return (
    <Card pending={isPending} className={isNew ? "ring-2 ring-biscuit-300" : ""}>
      <div className="flex items-center gap-2 px-4 py-2.5">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        >
          {expanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
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

        <button
          onClick={() => onRemove(cookie.localId)}
          className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
          title="Delete cookie"
        >
          <FiTrash2 size={15} />
        </button>
      </div>

      {expanded && (
        <AdvancedFields cookie={cookie} onChange={onUpdate} />
      )}
    </Card>
  );
}
