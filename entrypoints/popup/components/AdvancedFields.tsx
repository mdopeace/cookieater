import Input from "./ui/Input";
import Select from "./ui/Select";
import type { CookieItem } from "../types";

interface AdvancedFieldsProps {
  cookie: CookieItem;
  onChange: (id: string, updates: Partial<CookieItem>) => void;
}

// datetime-local has no timezone; format/parse in local time, not UTC.
const toLocalInputValue = (seconds: number) => {
  const d = new Date(seconds * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function AdvancedFields({
  cookie,
  onChange,
}: AdvancedFieldsProps) {
  const set = (updates: Partial<CookieItem>) =>
    onChange(cookie.localId, updates);

  const expiresValue = cookie.expires > 0 ? toLocalInputValue(cookie.expires) : "";

  return (
    <div className="advanced-fields">
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
      <div className="cookie-flags">
        <label className="cookie-checkbox">
          <input
            type="checkbox"
            checked={cookie.secure}
            onChange={(e) => set({ secure: e.target.checked })}
          />
          Secure
        </label>
        <label className="cookie-checkbox">
          <input
            type="checkbox"
            checked={cookie.httpOnly}
            onChange={(e) => set({ httpOnly: e.target.checked })}
          />
          HttpOnly
        </label>
      </div>
      <div className="cookie-metadata">
        <span className="metadata-pill">{cookie.hostOnly ? "Host-only" : "Not host-only"}</span>
        <span className="metadata-pill">{cookie.session ? "Session" : "Persistent"}</span>
      </div>
    </div>
  );
}
