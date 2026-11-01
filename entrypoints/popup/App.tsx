import { useState, useMemo, useEffect, useRef } from "react";
import cookieEaterLogoUrl from "../../assets/icon.png";
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
  const searchInputRef = useRef<HTMLInputElement>(null);

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
    importCookies,
    clearAll,
    reload,
  } = useCookies(domain);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (event.repeat) return;

      const target = event.target;
      const isTyping =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.closest("input, textarea, select, [contenteditable='true']"));
      const isSlash =
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isTyping;
      const isCommandK =
        event.key.toLowerCase() === "k" &&
        (event.metaKey || event.ctrlKey) &&
        !event.altKey;

      if (!isSlash && !isCommandK) return;

      event.preventDefault();
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    };

    document.addEventListener("keydown", focusSearch);
    return () => document.removeEventListener("keydown", focusSearch);
  }, []);

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
      setSaveError(`Save failed: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSaveError(null);
    const failures: string[] = [];
    for (const localId of dirtyIds) {
      try {
        await saveCookie(localId);
      } catch (e) {
        failures.push((e as Error).message);
      }
    }
    if (failures.length) {
      setSaveError(
        `${failures.length} cookie${failures.length === 1 ? "" : "s"} could not be saved. ${failures.join(" ")}`,
      );
    }
    setSaving(false);
  };

  const handleDomainChange = (nextDomain: string) => {
    if (nextDomain === domain || dirtyIds.size === 0) {
      setDomain(nextDomain);
      return;
    }
    if (confirm("Discard unsaved cookie changes?")) setDomain(nextDomain);
  };

  const handleRefresh = () => {
    if (dirtyIds.size > 0 && !confirm("Discard unsaved cookie changes?"))
      return;
    reload();
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
    requestAnimationFrame(() =>
      document.getElementById(`cookie-name-${blank.localId}`)?.focus(),
    );
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

  const handleImport = async (data: CookieItem[]) => {
    const items: CookieItem[] = data
      .filter(
        (item) => item && typeof item === "object" && !Array.isArray(item),
      )
      .map((item) => ({
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
        partitionKey: item.partitionKey,
      }));

    setSaving(true);
    setSaveError(null);
    try {
      await importCookies(items);
    } catch (e) {
      setSaveError(`Import failed: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleClearAll = () => {
    if (!confirm("Clear all cookies for this domain?")) return;
    clearAll();
  };

  return (
    <div className="popup-shell flex flex-col h-full min-h-100">
      <div className="popup-sticky-header">
        <header className="popup-header">
          <img className="brand-logo" src={cookieEaterLogoUrl} alt="" />
          <div className="brand-lockup">
            <h1 className="brand-name">Cookieater</h1>
            <span className="brand-caption">Cookie workshop · 01</span>
          </div>
          <span className="popup-header-count" role="status" aria-live="polite">
            {cookies.length} {cookies.length === 1 ? "cookie" : "cookies"}
          </span>
        </header>
        <DomainBar
          domain={domain}
          onDomainChange={handleDomainChange}
          onRefresh={handleRefresh}
        />
      </div>
      <span className="visually-hidden" role="status" aria-live="polite">
        {saving ? "Saving cookie changes" : ""}
      </span>
      <main className="popup-main flex min-h-0 flex-1 flex-col">
        <SearchBar
          value={search}
          onChange={setSearch}
          inputRef={searchInputRef}
        />

        <div
          className={`grid transition-all duration-300 ease-in-out ${error ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
        >
          <div className="overflow-hidden min-h-0">
            <div
              className="feedback feedback-error"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </div>
          </div>
        </div>

        <div
          className={`grid transition-all duration-300 ease-in-out ${saveError ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
        >
          <div className="overflow-hidden min-h-0">
            <div
              className="feedback feedback-error whitespace-pre-wrap"
              role="alert"
              aria-live="assertive"
            >
              {saveError}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="popup-state flex-1" role="status" aria-live="polite">
            <span className="popup-state-title">Loading cookies</span>
            <span className="popup-state-copy">
              Checking this site for stored cookies…
            </span>
          </div>
        ) : cookies.length === 0 ? (
          <div className="popup-state flex-1">
            <span className="popup-state-title">No cookies found</span>
            <span className="popup-state-copy">
              There are no cookies for this domain yet.
            </span>
            <Button variant="secondary" size="sm" onClick={handleAdd}>
              Add a Cookie
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="popup-state flex-1">
            <span className="popup-state-title">No matching cookies</span>
            <span className="popup-state-copy">
              No cookies match “{search}”. Try another search.
            </span>
          </div>
        ) : (
          <div
            className="cookie-list flex-1 overflow-y-auto"
            role="list"
            aria-label="Cookies"
          >
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

        <span className="visually-hidden" role="status" aria-live="polite">
          {search
            ? `${filtered.length} matching cookie${filtered.length === 1 ? "" : "s"}`
            : ""}
        </span>
      </main>
      <ActionBar
        onAdd={handleAdd}
        onSaveAll={handleSaveAll}
        canSaveAll={dirtyIds.size > 0 && !saving}
        onExport={handleExport}
        onImport={handleImport}
        onClearAll={handleClearAll}
      />
    </div>
  );
}
