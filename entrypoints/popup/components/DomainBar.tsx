import { useEffect, useRef, useState } from "react";
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
  const domainButtonRef = useRef<HTMLButtonElement>(null);
  const domainInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) domainInputRef.current?.focus();
  }, [editing]);

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
    <div className="domain-bar">
      <FiGlobe className="domain-icon" size={15} aria-hidden="true" />
      <div className="flex-1 relative min-h-9">
        <div
          aria-hidden={editing}
          inert={editing}
          className={`absolute inset-0 flex items-center transition-all duration-200
            ${editing ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"}`}
        >
          <button
            ref={domainButtonRef}
            onClick={() => setEditing(true)}
            className="domain-display text-left transition-colors cursor-pointer"
            aria-label={`Edit domain${domain ? `, currently ${domain}` : ""}`}
            aria-expanded={editing}
          >
            {domain || "No domain"}
          </button>
        </div>
        <div
          aria-hidden={!editing}
          inert={!editing}
          className={`domain-edit-layer transition-all duration-200
            ${editing ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
        >
          <Input
            inputRef={domainInputRef}
            aria-label="Website domain"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
                requestAnimationFrame(() => domainButtonRef.current?.focus());
              }
              if (e.key === "Escape") {
                setInput(domain);
                setEditing(false);
                requestAnimationFrame(() => domainButtonRef.current?.focus());
              }
            }}
            onBlur={handleSubmit}
          />
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        icon={<FiRotateCw aria-hidden="true" />}
        aria-label="Refresh cookies"
      />
    </div>
  );
}
