import { useState, useMemo } from "react";
import type { CookieItem } from "./types";
import { useCookies } from "./hooks/useCookies";
import DomainBar from "./components/DomainBar";
import SearchBar from "./components/SearchBar";
import CookieCard from "./components/CookieCard";
import ActionBar from "./components/ActionBar";
import Button from "./components/ui/Button";

export default function App() {
  const [domain, setDomain] = useState("");
  const [search, setSearch] = useState("");

  const {
    cookies,
    loading,
    error,
    dirtyIds,
    newIds,
    addCookie,
    updateCookie,
    removeCookie,
    saveCookie,
    clearAll,
    reload,
  } = useCookies(domain);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      cookies.filter((c) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.value.toLowerCase().includes(q) ||
          c.domain.toLowerCase().includes(q)
        );
      }),
    [cookies, search],
  );

  const handleSaveOne = async (localId: string) => {
    setSaving(true);
    setSaveError(null);
    try {
      await saveCookie(localId);
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = () => {
    const blank: CookieItem = {
      localId: crypto.randomUUID(),
      name: "",
      value: "",
      domain,
      path: "/",
      expires: -1,
      secure: false,
      httpOnly: false,
      sameSite: "lax",
      session: false,
      hostOnly: false,
    };
    addCookie(blank);
  };

  const handleExport = () => {
    const data = JSON.stringify(cookies, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cookies-${domain}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (data: CookieItem[]) => {
    for (const item of data) {
      addCookie({
        localId: crypto.randomUUID(),
        name: item.name ?? "",
        value: item.value ?? "",
        domain: item.domain ?? domain,
        path: item.path ?? "/",
        expires: item.expires ?? -1,
        secure: item.secure ?? false,
        httpOnly: item.httpOnly ?? false,
        sameSite: item.sameSite ?? "lax",
        session: item.session ?? false,
        hostOnly: item.hostOnly ?? false,
      });
    }
  };

  const handleClearAll = () => {
    if (!confirm("Clear all cookies for this domain?")) return;
    clearAll();
  };

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-biscuit-500 text-white">
        <span className="font-fredoka font-bold text-lg">cookieater</span>
        <span className="text-biscuit-200 text-xs">🍪</span>
      </div>

      <DomainBar domain={domain} onDomainChange={setDomain} onRefresh={reload} />
      <SearchBar value={search} onChange={setSearch} />

      <div className={`grid transition-all duration-300 ease-in-out ${error ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden min-h-0">
          <div className="px-4 py-2 text-sm text-red-600 bg-red-50 mx-4 rounded-lg mb-2">
            {error}
          </div>
        </div>
      </div>

      <div className={`grid transition-all duration-300 ease-in-out ${saveError ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden min-h-0">
          <div className="px-4 py-2 text-sm text-red-600 bg-red-50 mx-4 rounded-lg whitespace-pre-wrap mb-2">
            {`Save failed:\n${saveError}`}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Loading cookies...
        </div>
      ) : cookies.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-sm gap-3 px-4">
          <span>No cookies found for this domain</span>
          <Button variant="secondary" size="sm" onClick={handleAdd}>
            Add a Cookie
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          No cookies match "{search}"
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {filtered.map((cookie) => (
            <CookieCard
              key={cookie.localId}
              cookie={cookie}
              isDirty={dirtyIds.has(cookie.localId)}
              isNew={newIds.has(cookie.localId)}
              saving={saving}
              onUpdate={updateCookie}
              onRemove={removeCookie}
              onSave={handleSaveOne}
            />
          ))}
        </div>
      )}

      <ActionBar
        onAdd={handleAdd}
        onExport={handleExport}
        onImport={handleImport}
        onClearAll={handleClearAll}
      />
    </div>
  );
}
