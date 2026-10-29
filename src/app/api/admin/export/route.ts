import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isValidAdminCookie } from "@/lib/admin-auth";
import { listOrders } from "@/lib/db";
import { listEvents } from "@/lib/events";
import { orderLanguage, orderQuantity, STATUS_LABEL } from "@/lib/orders";

const csv = (rows: Record<string, unknown>[]) => {
  if (!rows.length) return "";
  const keys = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const esc = (v: unknown) => { const s = typeof v === "object" && v !== null ? JSON.stringify(v) : String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
};

/** Raw exports (SPEC §13 "what counts as proof"). */
export async function GET(req: Request) {
  const store = await cookies();
  if (!isValidAdminCookie(store.get("estoria_admin")?.value)) return new NextResponse("forbidden", { status: 403 });
  const what = new URL(req.url).searchParams.get("what");
  const rows = what === "orders_full"
    // Admin → Series orders "Export CSV": the working list for the team and the courier (names, numbers, addresses)
    ? (await listOrders(10000)).map((o) => ({ id: o.id, created_at: o.created_at, stage: STATUS_LABEL[o.status], child: o.child.name, age: o.child.age, gender: o.child.gender, quantity: orderQuantity(o), language: orderLanguage(o), books: o.books.map((b) => b.struggle).join(" | "), parent: o.parent.name, whatsapp: o.parent.whatsapp, governorate: o.parent.governorate, city: o.parent.city, street: o.parent.street, landmark: o.parent.landmark ?? "", best_time: o.parent.best_time ?? "", total: o.total, promo: o.promo_code ?? "", gift_recipient: o.parent.gift?.recipient ?? "", gift_message: o.parent.gift?.message ?? "", hide_price: o.parent.gift?.hide_price ? "yes" : "", dedication: o.dedication ?? "", courier: o.courier_confirmation ?? "", notes: o.notes ?? "" }))
    : what === "orders"
    ? (await listOrders(10000)).map((o) => ({ id: o.id, created_at: o.created_at, status: o.status, child_age: o.child.age, gender: o.child.gender, quantity: orderQuantity(o), language: orderLanguage(o), books: o.books.map((b) => b.struggle).join("|"), governorate: o.parent.governorate, city: o.parent.city, total: o.total, promo: o.promo_code ?? "", ref: o.ref ?? "", courier: o.courier_confirmation ?? "", gift: o.parent.gift ? "yes" : "", gift_recipient: o.parent.gift?.recipient ?? "", gift_message: o.parent.gift?.message ?? "", hide_price: o.parent.gift?.hide_price ? "yes" : "" }))
    : (await listEvents()).map((e) => ({ created_at: e.created_at, event: e.event, story_id: e.story_id ?? "", order_id: e.order_id ?? "", tale: e.tale ?? "", gender: e.gender ?? "", child_age: e.child_age ?? "", session_id: e.session_id ?? "", parent_id: e.parent_id ?? "", source: e.source ?? e.ref ?? "", step: e.step ?? "", page: e.page ?? "", meta: e.meta ?? "" }));
  return new NextResponse(csv(rows as Record<string, unknown>[]), { headers: { "content-type": "text/csv", "content-disposition": `attachment; filename=gtales-${what === "orders_full" ? `orders-${new Date().toISOString().slice(0, 10)}` : what === "orders" ? "orders" : "events"}.csv` } });
}
