import { createHmac, timingSafeEqual } from "crypto";

const secret = () => process.env.ADMIN_PASSWORD || "estoria-dev";

export function adminCookieValue(): string {
  return createHmac("sha256", secret()).update("estoria-admin-session").digest("hex");
}

export function isValidAdminCookie(v: string | undefined): boolean {
  if (!v) return false;
  const a = Buffer.from(v), b = Buffer.from(adminCookieValue());
  return a.length === b.length && timingSafeEqual(a, b);
}

export function checkPassword(p: string): boolean {
  const a = Buffer.from(p), b = Buffer.from(secret());
  return a.length === b.length && timingSafeEqual(a, b);
}
