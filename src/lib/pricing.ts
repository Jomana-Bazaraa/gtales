/** Server-side pricing: env only (src/lib/gtales.ts getPricing), never Admin → Settings, so the price lives in one place. */
import { getPricing, priceBreakdown, type Pricing } from "./gtales";

export async function currentPricing(): Promise<Pricing> {
  return getPricing();
}
export async function currentBreakdown(quantity = 1) { return priceBreakdown(await currentPricing(), quantity); }
