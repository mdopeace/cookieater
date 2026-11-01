import { useRef, useState } from "react";
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
  const [importError, setImportError] = useState("");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (Array.isArray(data)) {
          onImport(data);
        } else {
          setImportError("Import failed. Choose a JSON array of cookies.");
        }
      } catch {
        setImportError("Import failed. The selected file is not valid JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <footer className="action-bar" aria-label="Cookie actions">
      {importError && (
        <p className="feedback feedback-error" role="alert">
          {importError}
        </p>
      )}
      <div className="action-bar-buttons">
        <Button
          id="add-cookie-button"
          variant="secondary"
          size="sm"
          icon={<FiPlus aria-hidden="true" />}
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
          icon={<FiDownload aria-hidden="true" />}
          onClick={onExport}
        >
          Export
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<FiUpload aria-hidden="true" />}
          onClick={() => fileRef.current?.click()}
        >
          Import
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<FiTrash2 aria-hidden="true" />}
          onClick={onClearAll}
        >
          Clear All
        </Button>

        <input
          ref={fileRef}
          type="file"
          accept=".json"
          aria-label="Choose a JSON file containing cookies"
          onChange={handleFile}
          className="hidden"
        />
      </div>
    </footer>
  );
}
