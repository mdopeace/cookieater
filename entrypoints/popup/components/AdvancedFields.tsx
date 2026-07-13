import Input from "./ui/Input";
import Select from "./ui/Select";
import type { CookieItem } from "../types";

interface AdvancedFieldsProps {
  cookie: CookieItem;
  onChange: (id: string, updates: Partial<CookieItem>) => void;
}

export default function AdvancedFields({
  cookie,
  onChange,
}: AdvancedFieldsProps) {
  const set = (updates: Partial<CookieItem>) =>
    onChange(cookie.localId, updates);

  const expiresValue =
    cookie.expires > 0
      ? new Date(cookie.expires * 1000).toISOString().slice(0, 16)
      : "";

  return (
    <div className="px-4 pb-3 pt-1 border-t border-gray-100 space-y-2.5">
      <Input
        label="Domain"
        value={cookie.domain}
        onChange={(e) => set({ domain: e.target.value })}
      />
      <Input
        label="Path"
        value={cookie.path}
        onChange={(e) => set({ path: e.target.value })}
      />
      <Input
        label="Expires"
        type="datetime-local"
        value={expiresValue}
        onChange={(e) => {
          const val = e.target.value;
          set({
            expires: val ? Math.floor(new Date(val).getTime() / 1000) : -1,
          });
        }}
      />
      <Select
        label="SameSite"
        options={[
          { value: "lax", label: "Lax" },
          { value: "strict", label: "Strict" },
          { value: "no_restriction", label: "None" },
          { value: "unspecified", label: "Unspecified" },
        ]}
        value={cookie.sameSite}
        onChange={(e) =>
          set({
            sameSite: e.target.value as CookieItem["sameSite"],
          })
        }
      />
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={cookie.secure}
            onChange={(e) => set({ secure: e.target.checked })}
            className="rounded border-gray-300 text-biscuit-500 focus:ring-biscuit-500"
          />
          Secure
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={cookie.httpOnly}
            onChange={(e) => set({ httpOnly: e.target.checked })}
            className="rounded border-gray-300 text-biscuit-500 focus:ring-biscuit-500"
          />
          HttpOnly
        </label>
      </div>
      <div className="flex gap-4 text-xs text-gray-400">
        <span>{cookie.hostOnly ? "Host-only" : "Not host-only"}</span>
        <span>{cookie.session ? "Session" : "Persistent"}</span>
      </div>
    </div>
  );
}
