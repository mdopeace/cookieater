import type { Ref } from "react";
import { FiSearch } from "react-icons/fi";
import Input from "./ui/Input";

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  inputRef: Ref<HTMLInputElement>;
}

export default function SearchBar({ value, onChange, inputRef }: SearchBarProps) {
  return (
    <div className="search-wrap" role="search">
      <Input
        label="Search cookies"
        labelClassName="visually-hidden"
        inputRef={inputRef}
        className="search-input pr-10"
        icon={<FiSearch aria-hidden="true" />}
        placeholder="Search cookies..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-keyshortcuts="Control+K Meta+K /"
      />
      <kbd className="search-shortcut" aria-hidden="true">/</kbd>
    </div>
  );
}
