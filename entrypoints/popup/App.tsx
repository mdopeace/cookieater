import { useState, useMemo } from "react";
import cookieaterIconUrl from "../../assets/icon.png";
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
    <div className="popup-shell flex flex-col h-full min-h-[400px]">
      <header className="popup-header">
        <img className="brand-logo" src={cookieaterIconUrl} alt="" />
        <div className="brand-lockup">
          <span className="brand-name">Cookieater</span>
          <span className="brand-caption">Cookie manager</span>
        </div>
        <span className="popup-header-count">
          {cookies.length} {cookies.length === 1 ? "cookie" : "cookies"}
        </span>
      </header>

      <DomainBar domain={domain} onDomainChange={setDomain} onRefresh={reload} />
      <SearchBar value={search} onChange={setSearch} />

      <div className={`grid transition-all duration-300 ease-in-out ${error ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden min-h-0">
          <div className="feedback feedback-error">
            {error}
          </div>
        </div>
      </div>

      <div className={`grid transition-all duration-300 ease-in-out ${saveError ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden min-h-0">
          <div className="feedback feedback-error whitespace-pre-wrap">
            {`Save failed:\n${saveError}`}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="popup-state flex-1">
          <span className="popup-state-title">Loading cookies</span>
          <span className="popup-state-copy">Checking this site for stored cookies…</span>
        </div>
      ) : cookies.length === 0 ? (
        <div className="popup-state flex-1">
          <span className="popup-state-title">No cookies found</span>
          <span className="popup-state-copy">There are no cookies for this domain yet.</span>
          <Button variant="secondary" size="sm" onClick={handleAdd}>
            Add a Cookie
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="popup-state flex-1">
          <span className="popup-state-title">No matching cookies</span>
          <span className="popup-state-copy">No cookies match “{search}”. Try another search.</span>
        </div>
      ) : (
        <div className="cookie-list flex-1 overflow-y-auto">
          <div className="cookie-list-inner">
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
