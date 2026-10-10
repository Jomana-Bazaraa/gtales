/** Server-side pricing from Admin → Settings (falls back to env defaults). */
import { priceBreakdown, type Pricing } from "./gtales";
import { getSettings } from "./settings";

export async function currentPricing(): Promise<Pricing> {
  const s = await getSettings();
  return { listPrice: s.list_price_egp, promoCode: s.default_promo, promoPercent: s.promo_percent, delivery: s.delivery_egp };
}
export async function currentBreakdown() { return priceBreakdown(await currentPricing()); }
