export interface CookieItem {
  localId: string;
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  secure: boolean;
  httpOnly: boolean;
  sameSite: "unspecified" | "no_restriction" | "lax" | "strict";
  session: boolean;
  hostOnly: boolean;
}

export interface PendingChange {
  localId: string;
  type: "add" | "update" | "delete";
  original: CookieItem | null;
  current: CookieItem | null;
}
