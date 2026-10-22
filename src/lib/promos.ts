/**
 * Promo codes (SPEC §9, Admin → Dashboard). Supabase table `promo_codes` + `promo_redemptions`;
 * a use is claimed atomically by the SQL function `redeem_promo` (migration 0004) and given back on cancel.
 * Mock mode (no Supabase): the same rules on .data/ files, seeded with LAUNCH40 and GTALESFAMILY.
 */
import { promises as fs } from "fs";
import path from "path";
import { isMockDb, supabase } from "./db";
import { normaliseContact } from "./parents";

export interface PromoCode {
  code: string;
  percent_off: number;
  covers_delivery: boolean;
  max_uses: number | null;
  uses: number;
  max_per_phone: number | null;
  starts_at?: string | null;
  expires_at: string | null;
  active: boolean;
}
export type PromoReason = "invalid" | "not_started" | "expired" | "used_up" | "phone_limit";

export const PROMO_MESSAGES: Record<PromoReason, string> = {
  invalid: "This code isn't valid.",
  not_started: "This code isn't active yet.",
  expired: "This code has expired.",
  used_up: "This code has been used up.",
  phone_limit: "This code was already used with this WhatsApp number.",
};

/** Book discount and delivery for a list price under a code (percent of the book only; delivery free only if covered). */
export function promoPrice(listPrice: number, delivery: number, promo: Pick<PromoCode, "percent_off" | "covers_delivery"> | null) {
  const discount = promo ? Math.round((listPrice * promo.percent_off) / 100) : 0;
  const del = promo?.covers_delivery ? 0 : delivery;
  return { discount, delivery: del, total: listPrice - discount + del };
}

/** Why a code can't be used right now (ignoring the per-phone rule), or null if it can. */
export function promoProblem(p: PromoCode | null, now = new Date()): PromoReason | null {
  if (!p || !p.active) return "invalid";
  if (p.starts_at && new Date(p.starts_at) > now) return "not_started";
  if (p.expires_at && new Date(p.expires_at) <= now) return "expired";
  if (p.max_uses != null && p.uses >= p.max_uses) return "used_up";
  return null;
}

// ---------- store ----------
const DIR = path.join(process.cwd(), ".data");
const MOCK_SEED: PromoCode[] = [
  { code: "LAUNCH40", percent_off: 40, covers_delivery: false, max_uses: null, uses: 0, max_per_phone: null, expires_at: null, active: true },
  { code: "GTALESFAMILY", percent_off: 100, covers_delivery: false, max_uses: 30, uses: 0, max_per_phone: 1, expires_at: "2026-11-05T23:59:59+02:00", active: true },
];
type Redemption = { code: string; phone: string; order_id: string; created_at: string };
async function mockRead() {
  const read = async <T,>(f: string, d: T): Promise<T> => JSON.parse(await fs.readFile(path.join(DIR, f), "utf8").catch(() => JSON.stringify(d)));
  return { promos: await read<PromoCode[]>("promos.json", MOCK_SEED), redemptions: await read<Redemption[]>("promo_redemptions.json", []) };
}
async function mockWrite(promos: PromoCode[], redemptions: Redemption[]) {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(path.join(DIR, "promos.json"), JSON.stringify(promos, null, 2));
  await fs.writeFile(path.join(DIR, "promo_redemptions.json"), JSON.stringify(redemptions, null, 2));
}
const fromRow = (r: Record<string, unknown>): PromoCode => ({
  code: String(r.code), percent_off: Number(r.percent_off ?? r.percent ?? 0), covers_delivery: !!r.covers_delivery,
  max_uses: r.max_uses == null ? null : Number(r.max_uses), uses: Number(r.uses ?? 0), max_per_phone: r.max_per_phone == null ? null : Number(r.max_per_phone),
  starts_at: (r.starts_at as string) ?? null, expires_at: (r.expires_at as string) ?? null, active: r.active !== false,
});

export async function listPromos(): Promise<PromoCode[]> {
  if (isMockDb) return (await mockRead()).promos;
  const { data } = await supabase().from("promo_codes").select("*").order("created_at", { ascending: true });
  return (data ?? []).map(fromRow);
}
export async function getPromo(code: string): Promise<PromoCode | null> {
  const c = code.trim().toUpperCase();
  if (!c) return null;
  if (isMockDb) return (await mockRead()).promos.find((p) => p.code.toUpperCase() === c) ?? null;
  const { data } = await supabase().from("promo_codes").select("*").eq("code", c).maybeSingle(); // codes are stored upper-case
  return data ? fromRow(data) : null;
}
async function phoneUses(code: string, phone: string): Promise<number> {
  if (isMockDb) return (await mockRead()).redemptions.filter((r) => r.code === code && r.phone === phone).length;
  const { count } = await supabase().from("promo_redemptions").select("id", { count: "exact", head: true }).eq("code", code).eq("phone", phone);
  return count ?? 0;
}

/** Read-only check for the order form (nothing is claimed). */
export async function checkPromo(code: string, whatsapp?: string): Promise<{ ok: true; promo: PromoCode } | { ok: false; reason: PromoReason }> {
  const p = await getPromo(code);
  const problem = promoProblem(p);
  if (problem) return { ok: false, reason: problem };
  if (whatsapp && p!.max_per_phone != null && (await phoneUses(p!.code, normaliseContact(whatsapp))) >= p!.max_per_phone) return { ok: false, reason: "phone_limit" };
  return { ok: true, promo: p! };
}

/** Claims one use of the code for this order (atomic in Supabase). */
export async function redeemPromo(code: string, whatsapp: string, orderId: string): Promise<{ ok: true; promo: PromoCode } | { ok: false; reason: PromoReason }> {
  const phone = normaliseContact(whatsapp);
  if (isMockDb) {
    const { promos, redemptions } = await mockRead();
    const p = promos.find((x) => x.code.toUpperCase() === code.trim().toUpperCase()) ?? null;
    const problem = promoProblem(p);
    if (problem) return { ok: false, reason: problem };
    if (p!.max_per_phone != null && redemptions.filter((r) => r.code === p!.code && r.phone === phone).length >= p!.max_per_phone) return { ok: false, reason: "phone_limit" };
    p!.uses++;
    redemptions.push({ code: p!.code, phone, order_id: orderId, created_at: new Date().toISOString() });
    await mockWrite(promos, redemptions);
    return { ok: true, promo: p! };
  }
  const { data, error } = await supabase().rpc("redeem_promo", { p_code: code, p_phone: phone, p_order_id: orderId });
  if (error) throw error;
  const r = (Array.isArray(data) ? data[0] : data) as { ok: boolean; reason: PromoReason | null; code: string | null; percent_off: number; covers_delivery: boolean } | undefined;
  if (!r?.ok) return { ok: false, reason: r?.reason ?? "invalid" };
  const p = await getPromo(r.code!);
  return { ok: true, promo: p ?? { code: r.code!, percent_off: r.percent_off, covers_delivery: r.covers_delivery, max_uses: null, uses: 0, max_per_phone: null, expires_at: null, active: true } };
}

/** Gives the use back (order cancelled, or the order failed to save). Never throws. */
export async function releasePromo(orderId: string): Promise<void> {
  try {
    if (isMockDb) {
      const { promos, redemptions } = await mockRead();
      const r = redemptions.find((x) => x.order_id === orderId);
      if (!r) return;
      const p = promos.find((x) => x.code === r.code);
      if (p) p.uses = Math.max(0, p.uses - 1);
      await mockWrite(promos, redemptions.filter((x) => x !== r));
      return;
    }
    const { error } = await supabase().rpc("release_promo", { p_order_id: orderId });
    if (error) throw error;
  } catch (e) {
    console.error("[promo] release", orderId, e);
  }
}

/** Admin → Settings keeps the default code's percent in step with its promo_codes row. */
export async function syncDefaultPromo(code: string, percent: number): Promise<void> {
  const c = code.trim().toUpperCase();
  if (!c) return;
  if (isMockDb) {
    const { promos, redemptions } = await mockRead();
    const p = promos.find((x) => x.code === c);
    if (p) p.percent_off = percent; else promos.push({ code: c, percent_off: percent, covers_delivery: false, max_uses: null, uses: 0, max_per_phone: null, expires_at: null, active: true });
    return mockWrite(promos, redemptions);
  }
  const { data } = await supabase().from("promo_codes").select("code").eq("code", c).maybeSingle();
  if (data) await supabase().from("promo_codes").update({ percent_off: percent, percent }).eq("code", c);
  else await supabase().from("promo_codes").insert({ code: c, percent, percent_off: percent, active: true });
}
