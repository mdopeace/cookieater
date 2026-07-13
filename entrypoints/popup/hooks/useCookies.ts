import { useState, useEffect, useCallback } from "react";
import { browser } from "wxt/browser";
import type { CookieItem } from "../types";

const normalPath = (p: string) => (p.startsWith("/") ? p : `/${p}`);

function toCookieItem(c: {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
  secure: boolean;
  httpOnly: boolean;
  sameSite?: string;
  session: boolean;
  hostOnly: boolean;
}): CookieItem {
  return {
    localId: crypto.randomUUID(),
    name: c.name,
    value: c.value,
    domain: c.domain,
    path: c.path,
    expires: c.expires ?? -1,
    secure: c.secure,
    httpOnly: c.httpOnly,
    sameSite: (c.sameSite ?? "unspecified") as CookieItem["sameSite"],
    session: c.session,
    hostOnly: c.hostOnly,
  };
}

export function useCookies(domain: string) {
  const [cookies, setCookies] = useState<CookieItem[]>([]);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!domain) return;
    setLoading(true);
    setError(null);
    try {
      const raw = await browser.cookies.getAll({ domain });
      setCookies(raw.map(toCookieItem));
      setDirtyIds(new Set());
      setNewIds(new Set());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [domain]);

  useEffect(() => {
    load();
  }, [load]);

  const addCookie = useCallback((item: CookieItem) => {
    setCookies((prev) => [...prev, item]);
    setNewIds((prev) => new Set(prev).add(item.localId));
    setDirtyIds((prev) => new Set(prev).add(item.localId));
  }, []);

  const updateCookie = useCallback(
    (localId: string, updates: Partial<CookieItem>) => {
      setCookies((prev) =>
        prev.map((c) => (c.localId === localId ? { ...c, ...updates } : c)),
      );
      setDirtyIds((prev) => new Set(prev).add(localId));
    },
    [],
  );

  const removeCookie = useCallback(
    async (localId: string) => {
      const cookie = cookies.find((c) => c.localId === localId);
      if (!cookie) return;

      if (newIds.has(localId)) {
        setCookies((prev) => prev.filter((c) => c.localId !== localId));
        setNewIds((prev) => {
          const s = new Set(prev);
          s.delete(localId);
          return s;
        });
        setDirtyIds((prev) => {
          const s = new Set(prev);
          s.delete(localId);
          return s;
        });
        return;
      }

      try {
        const url = `https://${cookie.domain.replace(/^\./, "")}${normalPath(cookie.path)}`;
        await browser.cookies.remove({ name: cookie.name, url });
        setCookies((prev) => prev.filter((c) => c.localId !== localId));
        setDirtyIds((prev) => {
          const s = new Set(prev);
          s.delete(localId);
          return s;
        });
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [cookies, newIds],
  );

  const saveCookie = useCallback(
    async (localId: string) => {
      const cookie = cookies.find((c) => c.localId === localId);
      if (!cookie) return;

      const np = normalPath(cookie.path);
      const url = `https://${cookie.domain.replace(/^\./, "")}${np}`;
      const sameSite = cookie.sameSite;

      await browser.cookies.set({
        url,
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain.replace(/^\./, ""),
        path: np,
        expirationDate: cookie.expires >= 0 ? cookie.expires : undefined,
        secure: sameSite === "no_restriction" ? true : cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite,
      });

      setDirtyIds((prev) => {
        const s = new Set(prev);
        s.delete(localId);
        return s;
      });
      setNewIds((prev) => {
        const s = new Set(prev);
        s.delete(localId);
        return s;
      });
    },
    [cookies],
  );

  const clearAll = useCallback(async () => {
    for (const c of cookies) {
      if (newIds.has(c.localId)) continue;
      try {
        const url = `https://${c.domain.replace(/^\./, "")}${normalPath(c.path)}`;
        await browser.cookies.remove({ name: c.name, url });
      } catch {
        /* skip per-cookie errors during clear all */
      }
    }
    setCookies([]);
    setDirtyIds(new Set());
    setNewIds(new Set());
  }, [cookies, newIds]);

  return {
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
    reload: load,
  };
}
