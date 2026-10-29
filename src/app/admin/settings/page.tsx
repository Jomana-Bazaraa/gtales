import { cookies } from "next/headers";
import { TestEmail } from "@/components/admin/TestEmail";
import { redirect } from "next/navigation";
import { isValidAdminCookie } from "@/lib/admin-auth";
import { getSettings } from "@/lib/settings";
import { priceBreakdown } from "@/lib/gtales";

/** Admin → Settings (SPEC §11): every configurable value in one form. */
export default async function AdminSettings({ searchParams }: PageProps<"/admin/settings">) {
  const store = await cookies();
  if (!isValidAdminCookie(store.get("estoria_admin")?.value)) redirect("/admin/login");
  const s = await getSettings();
  const sp = await searchParams;
  const F = ({ name, label, value, type = "text", hint }: { name: string; label: string; value: string | number; type?: string; hint?: string }) => (
    <label className="flex flex-col gap-1 font-bold text-sm">{label}<input name={name} defaultValue={String(value)} type={type} className="field font-medium" />{hint && <span className="text-xs font-medium text-ink-soft">{hint}</span>}</label>
  );
  const p = priceBreakdown();
  return (
    <div className="max-w-2xl flex flex-col gap-4">
    <form action="/api/admin/settings" method="post" className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      {sp.saved && <p className="m-0 rounded-xl bg-mint-soft text-mint p-3 text-sm font-bold">Saved. Pages update within 30 seconds.</p>}
      <div className="card p-4 grid md:grid-cols-2 gap-3">
        <p className="m-0 md:col-span-2 text-sm"><b>Prices</b> (one place: Cloudflare variables <code>NEXT_PUBLIC_LIST_PRICE_EGP</code>, <code>NEXT_PUBLIC_PROMO_PERCENT</code>, <code>NEXT_PUBLIC_DELIVERY_EGP</code>): {p.listPrice} EGP per book, launch {p.promoPercent}% ({p.promoCode}) → <b>{p.net} EGP per book</b>, delivery {p.delivery} EGP per order. Example: 3 books = {p.net * 3} + {p.delivery} = {p.net * 3 + p.delivery} EGP.</p>
        <F name="production_days" label="Production days (shown to parents)" value={s.production_days} type="number" />
        <F name="delivery_days" label="Delivery days after approval" value={s.delivery_days} type="number" />
        <F name="rate_limit_per_hour" label="Free stories per hour per device (silent)" value={s.rate_limit_per_hour} type="number" />
        <F name="whatsapp_number" label="Business WhatsApp (intl, no +)" value={s.whatsapp_number} hint="e.g. 2010xxxxxxxx" />
      </div>
      <div className="card p-4 flex flex-col gap-3">
        <F name="promo_bar" label="Promo bar text (empty = hidden)" value={s.promo_bar} />
        <p className="m-0 text-sm text-ink-soft">Reviews: the home page section appears by itself once a review is approved in <a className="text-sky font-bold" href="/admin/reviews">Admin → Reviews</a>; the average rating shows from 3 reviews.</p>
      </div>
      <button className="btn-primary self-start">Save settings</button>
    </form>
    <TestEmail defaultTo={process.env.ADMIN_NOTIFY_EMAIL ?? ""} />
    </div>
  );
}
