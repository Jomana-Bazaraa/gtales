/**
 * Admin → Settings (SPEC §11): configurable values with env defaults.
 * Mock mode stores them in .data/settings.json; Supabase in the `settings` table.
 */
import { promises as fs } from "fs";
import path from "path";
import { isMockDb, supabase } from "./db";
import { COPY, getPricing } from "./gtales";

export interface Settings {
  list_price_egp: number; delivery_egp: number; default_promo: string; promo_percent: number; rate_limit_per_hour: number;
  promo_bar: string; production_days: number; delivery_days: number; whatsapp_number: string;
}
const num = (v: string | undefined, d: number) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : d; };
export const DEFAULTS: Settings = {
  // prices are NOT settings any more (fixnow A2): kept here only so old saved rows still parse; read getPricing()
  list_price_egp: getPricing().listPrice, delivery_egp: getPricing().delivery,
  default_promo: getPricing().promoCode, promo_percent: getPricing().promoPercent,
  rate_limit_per_hour: num(process.env.RATE_LIMIT_PER_HOUR, 10),
  promo_bar: COPY.promoBar(),
  production_days: 5, delivery_days: 5, whatsapp_number: process.env.NEXT_PUBLIC_WHATSAPP || "",
};
const FILE = path.join(process.cwd(), ".data", "settings.json");
let cache: { at: number; v: Settings } | null = null;

export async function getSettings(): Promise<Settings> {
  if (cache && Date.now() - cache.at < 30_000) return cache.v;
  let over: Partial<Settings> = {};
  try {
    if (isMockDb) over = JSON.parse(await fs.readFile(FILE, "utf8"));
    else {
      const { data } = await supabase().from("settings").select("key,value");
      for (const r of data ?? []) (over as Record<string, unknown>)[r.key] = r.value;
    }
  } catch {}
  const v = { ...DEFAULTS, ...over } as Settings;
  cache = { at: Date.now(), v };
  return v;
}
export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  cache = null;
  if (isMockDb) {
    const cur = await getSettings();
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify({ ...cur, ...patch }, null, 2));
    return;
  }
  for (const [key, value] of Object.entries(patch)) await supabase().from("settings").upsert({ key, value, updated_at: new Date().toISOString() });
}
