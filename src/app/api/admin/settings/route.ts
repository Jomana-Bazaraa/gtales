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
    // prices are not settings (fixnow A2): they come from the env only
    production_days: n("production_days"), delivery_days: n("delivery_days"), rate_limit_per_hour: n("rate_limit_per_hour") || 10,
    whatsapp_number: String(f.get("whatsapp_number") || "").replace(/\D/g, ""), promo_bar: String(f.get("promo_bar") || "").trim(),
  });
  return NextResponse.redirect(new URL("/admin/settings?saved=1", req.url), 303);
}
