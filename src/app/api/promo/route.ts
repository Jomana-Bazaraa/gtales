import { NextResponse } from "next/server";
import { currentBreakdown } from "@/lib/pricing";
import { checkPromo, PROMO_MESSAGES, promoPrice } from "@/lib/promos";

/** Order form check (nothing is claimed): GET /api/promo?code=GTALESFAMILY&whatsapp=010… */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const code = (q.get("code") ?? "").slice(0, 30);
  const whatsapp = (q.get("whatsapp") ?? "").replace(/[^\d+ ]/g, "").slice(0, 16) || undefined;
  const r = await checkPromo(code, whatsapp);
  if (!r.ok) return NextResponse.json({ ok: false, message: PROMO_MESSAGES[r.reason] }, { headers: { "cache-control": "no-store" } });
  const p = await currentBreakdown();
  return NextResponse.json(
    { ok: true, code: r.promo.code, percent_off: r.promo.percent_off, covers_delivery: r.promo.covers_delivery, ...promoPrice(p.listPrice, p.delivery, r.promo, Math.min(100, Math.max(1, Math.floor(Number(q.get("quantity")) || 1)))) },
    { headers: { "cache-control": "no-store" } },
  );
}
