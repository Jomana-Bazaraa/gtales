/**
 * Parent session (SPEC §10): passwordless. A signed cookie carries the identity
 * (email from a magic link, or WhatsApp number verified against an order number).
 */
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export interface Session { email?: string; whatsapp?: string; at: number }
const NAME = "gtales_session";
const secret = () => process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "gtales-dev";
const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function encodeSession(s: Session): string {
  const payload = Buffer.from(JSON.stringify(s)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}
export function decodeSession(v: string | undefined): Session | null {
  if (!v) return null;
  const [payload, sig] = v.split(".");
  if (!payload || !sig) return null;
  const a = Buffer.from(sig), b = Buffer.from(sign(payload));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const s = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    if (Date.now() - s.at > 90 * 86_400_000) return null; // 90 days
    return s;
  } catch { return null; }
}
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return decodeSession(store.get(NAME)?.value);
}
export const SESSION_COOKIE = NAME;
export function sessionCookie(s: Session) {
  return { name: NAME, value: encodeSession(s), httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 90 * 86_400 };
}
/** Normalise an Egyptian WhatsApp number to digits only, e.g. "010 1234 5678" → "01012345678", "+20101…" → "0101…" */
export function normalisePhone(p: string): string {
  const d = p.replace(/\D/g, "");
  if (d.startsWith("20") && d.length === 12) return "0" + d.slice(2);
  return d;
}
