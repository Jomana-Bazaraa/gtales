import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isValidAdminCookie } from "@/lib/admin-auth";
import { getSettings } from "@/lib/settings";

/** Admin → Settings (SPEC §11): every configurable value in one form. */
export default async function AdminSettings({ searchParams }: PageProps<"/admin/settings">) {
  const store = await cookies();
  if (!isValidAdminCookie(store.get("estoria_admin")?.value)) redirect("/admin/login");
  const s = await getSettings();
  const sp = await searchParams;
  const F = ({ name, label, value, type = "text", hint }: { name: string; label: string; value: string | number; type?: string; hint?: string }) => (
    <label className="flex flex-col gap-1 font-bold text-sm">{label}<input name={name} defaultValue={String(value)} type={type} className="field font-medium" />{hint && <span className="text-xs font-medium text-ink-soft">{hint}</span>}</label>
  );
  const promo = Math.round(s.list_price_egp * (1 - s.promo_percent / 100));
  return (
    <form action="/api/admin/settings" method="post" className="max-w-2xl flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      {sp.saved && <p className="m-0 rounded-xl bg-mint-soft text-mint p-3 text-sm font-bold">Saved. Pages update within 30 seconds.</p>}
      <div className="card p-4 grid md:grid-cols-2 gap-3">
        <F name="list_price_egp" label="List price (EGP, three books)" value={s.list_price_egp} type="number" />
        <F name="delivery_egp" label="Delivery (EGP)" value={s.delivery_egp} type="number" />
        <F name="default_promo" label="Default promo code" value={s.default_promo} />
        <F name="promo_percent" label="Promo %" value={s.promo_percent} type="number" hint={`Today: ${s.list_price_egp} → ${promo} + ${s.delivery_egp} delivery = ${promo + s.delivery_egp} EGP on delivery`} />
        <F name="production_days" label="Production days (shown to parents)" value={s.production_days} type="number" />
        <F name="delivery_days" label="Delivery days after approval" value={s.delivery_days} type="number" />
        <F name="rate_limit_per_hour" label="Free stories per hour per device (silent)" value={s.rate_limit_per_hour} type="number" />
        <F name="whatsapp_number" label="Business WhatsApp (intl, no +)" value={s.whatsapp_number} hint="e.g. 2010xxxxxxxx" />
      </div>
      <div className="card p-4 flex flex-col gap-3">
        <F name="promo_bar" label="Promo bar text (empty = hidden)" value={s.promo_bar} />
        <label className="flex items-center gap-2 font-bold text-sm"><input type="checkbox" name="reviews_visible" defaultChecked={s.reviews_visible} /> Show the reviews section (only once three real reviews with permission exist)</label>
      </div>
      <button className="btn-primary self-start">Save settings</button>
    </form>
  );
}
