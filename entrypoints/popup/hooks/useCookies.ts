import { useState, useEffect, useCallback, useMemo } from "react";
import { browser } from "wxt/browser";
import type { CookieItem } from "../types";

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
  type Change =
    | { localId: string; type: "add"; original: null; current: CookieItem }
    | { localId: string; type: "update"; original: CookieItem | null; current: CookieItem }
    | { localId: string; type: "delete"; original: CookieItem | null; current: null };

  const [cookies, setCookies] = useState<CookieItem[]>([]);
  const [pending, setPending] = useState<Change[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!domain) return;
    setLoading(true);
    setError(null);
    try {
      const raw = await browser.cookies.getAll({ domain });
      setCookies(raw.map(toCookieItem));
      setPending([]);
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
    setPending((prev) => [
      ...prev,
      { localId: item.localId, type: "add", original: null, current: item },
    ]);
  }, []);

  const updateCookie = useCallback(
    (localId: string, updates: Partial<CookieItem>) => {
      setPending((prev) => {
        const existing = prev.find((p) => p.localId === localId);
        const current = {
          ...(existing?.current ??
            cookies.find((c) => c.localId === localId)!),
          ...updates,
        };
        const filtered = prev.filter((p) => p.localId !== localId);
        const original = existing?.original ?? cookies.find((c) => c.localId === localId) ?? null;
        return [
          ...filtered,
          { localId, type: "update", original, current },
        ];
      });
    },
    [cookies],
  );

  const removeCookie = useCallback((localId: string) => {
    setPending((prev) => {
      const existing = prev.find((p) => p.localId === localId);
      if (existing?.type === "add") {
        return prev.filter((p) => p.localId !== localId);
      }
      const filtered = prev.filter((p) => p.localId !== localId);
      return [
        ...filtered,
        {
          localId,
          type: "delete" as const,
          original: existing?.original ?? null,
          current: null,
        },
      ];
    });
  }, []);

  const save = useCallback(async () => {
    const errors: string[] = [];

    for (const change of pending) {
      try {
        if (change.type === "delete" && change.original) {
          await browser.cookies.remove({
            name: change.original.name,
            url: `https://${change.original.domain}${change.original.path}`,
          });
        } else if (change.current) {
          const c = change.current;
          const url = `https://${c.domain}${c.path}`;
          await browser.cookies.set({
            url,
            name: c.name,
            value: c.value,
            domain: c.domain,
            path: c.path,
            expirationDate: c.expires >= 0 ? c.expires : undefined,
            secure: c.secure,
            httpOnly: c.httpOnly,
            sameSite: c.sameSite === "unspecified" ? "unspecified" : c.sameSite,
          });
        }
      } catch (e) {
        errors.push(`${change.current?.name ?? "?"}: ${(e as Error).message}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join("\n"));
    }

    await load();
  }, [pending, load]);

  const discard = useCallback(() => {
    load();
  }, [load]);

  const displayCookies = useMemo(() => {
    const map = new Map<string, CookieItem>();
    for (const c of cookies) {
      const p = pending.find((pc) => pc.localId === c.localId);
      if (p?.type === "delete") continue;
      map.set(c.localId, p?.current ?? c);
    }
    for (const p of pending) {
      if (p.type === "add" && p.current) {
        map.set(p.localId, p.current);
      }
    }
    return Array.from(map.values());
  }, [cookies, pending]);

  const hasChanges = pending.length > 0;

  return {
    cookies: displayCookies,
    pending,
    loading,
    error,
    hasChanges,
    addCookie,
    updateCookie,
    removeCookie,
    save,
    discard,
    reload: load,
  };
}
