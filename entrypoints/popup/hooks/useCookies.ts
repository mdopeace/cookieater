import { useState, useEffect, useCallback } from "react";
import { browser } from "wxt/browser";
import type { CookieItem } from "../types";

const normalPath = (p: string) => (p.startsWith("/") ? p : `/${p}`);

function toCookieItem(c: {
  name: string;
  value: string;
  domain: string;
  path: string;
  expirationDate?: number;
  secure: boolean;
  httpOnly: boolean;
  sameSite?: string;
  session: boolean;
  hostOnly: boolean;
  partitionKey?: CookieItem["partitionKey"];
}): CookieItem {
  return {
    localId: crypto.randomUUID(),
    name: c.name,
    value: c.value,
    domain: c.domain,
    path: c.path,
    expires: c.expirationDate ?? -1,
    secure: c.secure,
    httpOnly: c.httpOnly,
    sameSite: (c.sameSite ?? "unspecified") as CookieItem["sameSite"],
    session: c.session,
    hostOnly: c.hostOnly,
    partitionKey: c.partitionKey,
  };
}

// Non-secure cookies work over http; secure cookies can only be addressed over https.
const cookieUrl = (cookie: CookieItem, secure: boolean) =>
  `${secure ? "https" : "http"}://${cookie.domain.replace(/^\./, "")}${normalPath(cookie.path)}`;

async function persistCookie(cookie: CookieItem) {
  const secure =
    cookie.sameSite === "no_restriction" ? true : cookie.secure;
  await browser.cookies.set({
    url: cookieUrl(cookie, secure),
    name: cookie.name,
    value: cookie.value,
    // Omitting domain keeps the cookie host-only.
    domain: cookie.hostOnly ? undefined : cookie.domain.replace(/^\./, ""),
    path: normalPath(cookie.path),
    expirationDate: cookie.expires >= 0 ? cookie.expires : undefined,
    secure,
    httpOnly: cookie.httpOnly,
    sameSite: cookie.sameSite,
    partitionKey: cookie.partitionKey,
  });
}

async function removeCookieFromBrowser(cookie: CookieItem) {
  const removed = await browser.cookies.remove({
    name: cookie.name,
    // SameSite=None cookies are always Secure, including after persistence.
    url: cookieUrl(cookie, cookie.sameSite === "no_restriction" || cookie.secure),
    partitionKey: cookie.partitionKey,
  });
  if (!removed) throw new Error(`Cookie "${cookie.name}" was not found.`);
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
      // A domain-scoped cookie (for example `.stagedev.in`) applies to
      // `t0.platform.stagedev.in`, but `getAll({ domain: hostname })` only
      // searches the requested domain and its subdomains. Query by URL so the
      // browser returns every cookie applicable to this host, including its
      // parent-domain cookies. Check both schemes because secure cookies are
      // only returned for HTTPS while non-secure cookies may be HTTP-only.
      const hostname = domain.trim().replace(/^\.+/, "");
      const [httpCookies, httpsCookies] = await Promise.all([
        browser.cookies.getAll({ url: `http://${hostname}/` }),
        browser.cookies.getAll({ url: `https://${hostname}/` }),
      ]);
      const raw = Array.from(
        new Map(
          [...httpCookies, ...httpsCookies].map((cookie) => [
            `${cookie.storeId}:${cookie.partitionKey ? JSON.stringify(cookie.partitionKey) : ""}:${cookie.domain}:${cookie.path}:${cookie.name}`,
            cookie,
          ]),
        ).values(),
      );
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
    async (localId: string): Promise<boolean> => {
      const cookie = cookies.find((c) => c.localId === localId);
      if (!cookie) return false;

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
        return true;
      }

      try {
        await removeCookieFromBrowser(cookie);
        setCookies((prev) => prev.filter((c) => c.localId !== localId));
        setDirtyIds((prev) => {
          const s = new Set(prev);
          s.delete(localId);
          return s;
        });
        return true;
      } catch (e) {
        setError((e as Error).message);
        return false;
      }
    },
    [cookies, newIds],
  );

  const saveCookie = useCallback(
    async (localId: string) => {
      const cookie = cookies.find((c) => c.localId === localId);
      if (!cookie) return;

      await persistCookie(cookie);

      const effectiveSecure =
        cookie.sameSite === "no_restriction" ? true : cookie.secure;

      setDirtyIds((prev) => {
        const s = new Set(prev);
        s.delete(localId);
        return s;
      });
      setCookies((prev) =>
        prev.map((item) =>
          item.localId === localId
            ? {
                ...item,
                secure: effectiveSecure,
                session: item.expires < 0,
              }
            : item,
        ),
      );
      setNewIds((prev) => {
        const s = new Set(prev);
        s.delete(localId);
        return s;
      });
    },
    [cookies],
  );

  const importCookies = useCallback(
    async (items: CookieItem[]) => {
      let failed = 0;
      for (const item of items) {
        try {
          await persistCookie(item);
        } catch {
          failed++;
        }
      }
      await load();
      if (failed) {
        throw new Error(
          `${failed} of ${items.length} cookies could not be imported.`,
        );
      }
    },
    [load],
  );

  const clearAll = useCallback(async () => {
    let failed = 0;
    const failedIds = new Set<string>();
    for (const c of cookies) {
      if (newIds.has(c.localId)) continue;
      try {
        await removeCookieFromBrowser(c);
      } catch {
        failed++;
        failedIds.add(c.localId);
      }
    }
    if (failed) {
      setError(`${failed} cookie${failed === 1 ? "" : "s"} could not be cleared.`);
      setCookies((prev) => prev.filter((item) => failedIds.has(item.localId)));
    } else {
      setCookies([]);
    }
    setDirtyIds(new Set());
    setNewIds(new Set());
    return failed;
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
    importCookies,
    clearAll,
    reload: load,
  };
}
