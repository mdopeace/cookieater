import { useEffect, useState } from "react";
import { browser } from "wxt/browser";
import { FiGlobe, FiRotateCw } from "react-icons/fi";
import Input from "./ui/Input";
import Button from "./ui/Button";

interface DomainBarProps {
  domain: string;
  onDomainChange: (d: string) => void;
  onRefresh: () => void;
}

export default function DomainBar({
  domain,
  onDomainChange,
  onRefresh,
}: DomainBarProps) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(domain);

  useEffect(() => {
    setInput(domain);
  }, [domain]);

  useEffect(() => {
    (async () => {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const tab = tabs[0];
      if (tab?.url) {
        try {
          const hostname = new URL(tab.url).hostname;
          onDomainChange(hostname);
        } catch {}
      }
    })();
  }, []);

  const handleSubmit = () => {
    onDomainChange(input.trim());
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-biscuit-200 bg-white/60">
      <FiGlobe className="text-biscuit-500 shrink-0" size={16} />
      {editing ? (
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
            if (e.key === "Escape") {
              setInput(domain);
              setEditing(false);
            }
          }}
          onBlur={handleSubmit}
          className="flex-1"
          autoFocus
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="flex-1 text-sm font-medium text-gray-800 text-left hover:text-biscuit-600 transition-colors cursor-pointer"
          title="Click to edit domain"
        >
          {domain || "No domain"}
        </button>
      )}
      <Button variant="ghost" size="sm" onClick={onRefresh} icon={<FiRotateCw />} />
    </div>
  );
}
