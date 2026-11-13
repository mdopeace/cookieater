import { useState, useEffect, useCallback, useRef } from "react";
import { browser } from "wxt/browser";
import type { CookieItem } from "../types";

// Incognito uses its own default cookie store.
const usesContextCookieStore = browser.extension.inIncognitoContext;

const cookieStoreId = (cookie: CookieItem, storeId?: string) =>
  usesContextCookieStore ? undefined : (storeId ?? cookie.storeId);

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
  storeId: string;
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
    storeId: c.storeId,
  };
}

// Secure cookies require HTTPS.
const cookieUrl = (cookie: CookieItem, secure: boolean) =>
  `${secure ? "https" : "http"}://${cookie.domain.replace(/^\./, "")}${normalPath(cookie.path)}`;

async function persistCookie(cookie: CookieItem, storeId?: string) {
  const secure = cookie.sameSite === "no_restriction" ? true : cookie.secure;
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
    storeId: cookieStoreId(cookie, storeId),
  });
}

async function removeCookieFromBrowser(cookie: CookieItem, storeId?: string) {
  return browser.cookies.remove({
    name: cookie.name,
    // SameSite=None cookies require Secure.
    url: cookieUrl(
      cookie,
      cookie.sameSite === "no_restriction" || cookie.secure,
    ),
    partitionKey: cookie.partitionKey,
    storeId: cookieStoreId(cookie, storeId),
  });
}

const matchesDomain = (
  cookie: Pick<CookieItem, "domain" | "hostOnly">,
  hostname: string,
) => {
  const cookieDomain = cookie.domain.replace(/^\./, "").toLowerCase();
  const host = hostname.toLowerCase();
  return cookie.hostOnly
    ? host === cookieDomain
    : host === cookieDomain || host.endsWith(`.${cookieDomain}`);
};

const hasSameIdentity = (a: CookieItem, b: CookieItem) =>
  a.name === b.name && a.domain === b.domain && a.path === b.path;

export function useCookies(domain: string, storeId: string | undefined, storeReady: boolean) {
  const [cookies, setCookies] = useState<CookieItem[]>([]);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [loadingState, setLoading] = useState(true);
  const [loadedScope, setLoadedScope] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const originals = useRef(new Map<string, CookieItem>());
  const loadId = useRef(0);
  const hostname = domain.trim().replace(/^\.+/, "").replace(/\.$/, "");
  const scope = `${hostname}\u0000${storeId ?? ""}`;
  const loading =
    loadingState || !storeReady || (!!hostname && loadedScope !== scope);

  const load = useCallback(async () => {
    const currentLoad = ++loadId.current;
    const clearList = () => {
      originals.current.clear();
      setCookies([]);
      setDirtyIds(new Set());
      setNewIds(new Set());
    };
    if (!storeReady) {
      setLoading(true);
      return;
    }

    if (!hostname || (!storeId && !usesContextCookieStore)) {
      clearList();
      setError(
        hostname ? "Could not identify the active tab's cookie store." : null,
      );
      setLoadedScope(scope);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    clearList();
    try {
      const allCookies = await browser.cookies.getAll({
        storeId: usesContextCookieStore ? undefined : storeId,
      });
      if (currentLoad !== loadId.current) return;

      const raw = Array.from(
        new Map(
          allCookies
            .filter((cookie) => matchesDomain(cookie, hostname))
            .map((cookie) => [
              `${cookie.partitionKey ? JSON.stringify(cookie.partitionKey) : ""}:${cookie.domain}:${cookie.path}:${cookie.name}`,
              cookie,
            ]),
        ).values(),
      ).map(toCookieItem);
      originals.current = new Map(raw.map((cookie) => [cookie.localId, cookie]));
      setCookies(raw);
      setDirtyIds(new Set());
      setNewIds(new Set());
    } catch (e) {
      if (currentLoad === loadId.current) setError((e as Error).message);
    } finally {
      if (currentLoad === loadId.current) {
        setLoadedScope(scope);
        setLoading(false);
      }
    }
  }, [hostname, scope, storeId, storeReady]);

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
        originals.current.delete(localId);
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
        await removeCookieFromBrowser(originals.current.get(localId) ?? cookie, storeId);
        setCookies((prev) => prev.filter((c) => c.localId !== localId));
        originals.current.delete(localId);
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
    [cookies, newIds, storeId],
  );

  const saveCookie = useCallback(
    async (localId: string) => {
      const cookie = cookies.find((c) => c.localId === localId);
      if (!cookie) return;

      const original = originals.current.get(localId);
      if (original && !hasSameIdentity(original, cookie)) {
        await removeCookieFromBrowser(original, storeId);
        try {
          await persistCookie(cookie, storeId);
        } catch (error) {
          try {
            await persistCookie(original, storeId);
          } catch (restoreError) {
            throw new Error(
              `${(error as Error).message} The original cookie could not be restored: ${(restoreError as Error).message}`,
            );
          }
          throw error;
        }
      } else {
        await persistCookie(cookie, storeId);
      }

      const effectiveSecure =
        cookie.sameSite === "no_restriction" ? true : cookie.secure;
      originals.current.set(localId, {
        ...cookie,
        secure: effectiveSecure,
        session: cookie.expires < 0,
      });

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
    [cookies, storeId],
  );

  const importCookies = useCallback(
    async (items: CookieItem[]) => {
      let failed = 0;
      for (const item of items) {
        try {
          await persistCookie(item, storeId);
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
    [load, storeId],
  );

  const clearAll = useCallback(async () => {
    let failed = 0;
    const failedIds = new Set<string>();
    for (const c of cookies) {
      if (newIds.has(c.localId)) continue;
      try {
        await removeCookieFromBrowser(originals.current.get(c.localId) ?? c, storeId);
      } catch {
        failed++;
        failedIds.add(c.localId);
      }
    }
    if (failed) {
      setError(
        `${failed} cookie${failed === 1 ? "" : "s"} could not be cleared.`,
      );
      setCookies((prev) => prev.filter((item) => failedIds.has(item.localId)));
    } else {
      setCookies([]);
    }
    originals.current = new Map(
      cookies
        .filter((item) => failedIds.has(item.localId))
        .map((item) => [item.localId, originals.current.get(item.localId) ?? item]),
    );
    setDirtyIds(new Set());
    setNewIds(new Set());
    return failed;
  }, [cookies, newIds, storeId]);

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
