import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isValidAdminCookie } from "@/lib/admin-auth";
import { saveSettings } from "@/lib/settings";

export async function POST(req: Request) {
  const store = await cookies();
  if (!isValidAdminCookie(store.get("estoria_admin")?.value)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const f = await req.formData();
  const n = (k: string) => Math.max(0, Number(f.get(k)) || 0);
  await saveSettings({
    list_price_egp: n("list_price_egp"), delivery_egp: n("delivery_egp"), default_promo: String(f.get("default_promo") || "").trim().toUpperCase(),
    promo_percent: Math.min(100, n("promo_percent")), production_days: n("production_days"), delivery_days: n("delivery_days"), rate_limit_per_hour: n("rate_limit_per_hour") || 10,
    whatsapp_number: String(f.get("whatsapp_number") || "").replace(/\D/g, ""), promo_bar: String(f.get("promo_bar") || "").trim(), reviews_visible: f.get("reviews_visible") === "on",
  });
  return NextResponse.redirect(new URL("/admin/settings?saved=1", req.url), 303);
}
