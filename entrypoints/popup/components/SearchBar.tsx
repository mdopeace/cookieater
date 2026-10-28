import { FiSearch } from "react-icons/fi";
import Input from "./ui/Input";

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="search-wrap">
      <Input
        autoFocus
        icon={<FiSearch />}
        placeholder="Search cookies..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
