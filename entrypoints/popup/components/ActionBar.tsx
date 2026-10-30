import { useRef } from "react";
import {
  FiPlus,
  FiDownload,
  FiUpload,
  FiTrash2,
} from "react-icons/fi";
import Button from "./ui/Button";
import type { CookieItem } from "../types";

interface ActionBarProps {
  onAdd: () => void;
  onSaveAll: () => void;
  canSaveAll: boolean;
  onExport: () => void;
  onImport: (data: CookieItem[]) => void;
  onClearAll: () => void;
}

export default function ActionBar({
  onAdd,
  onSaveAll,
  canSaveAll,
  onExport,
  onImport,
  onClearAll,
}: ActionBarProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (Array.isArray(data)) onImport(data);
      } catch {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="action-bar">
      <div className="action-bar-buttons">
        <Button
          variant="secondary"
          size="sm"
          icon={<FiPlus />}
          onClick={onAdd}
        >
          Add Cookie
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={onSaveAll}
          disabled={!canSaveAll}
        >
          Save All
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<FiDownload />}
          onClick={onExport}
        >
          Export
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<FiUpload />}
          onClick={() => fileRef.current?.click()}
        >
          Import
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<FiTrash2 />}
          onClick={onClearAll}
        >
          Clear All
        </Button>

        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={handleFile}
          className="hidden"
        />
      </div>
    </div>
  );
}
