import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isValidAdminCookie } from "@/lib/admin-auth";
import { listOrders } from "@/lib/db";
import { listEvents } from "@/lib/events";

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
  const rows = what === "orders"
    ? (await listOrders(10000)).map((o) => ({ id: o.id, created_at: o.created_at, status: o.status, child_age: o.child.age, gender: o.child.gender, books: o.books.map((b) => b.struggle).join("|"), governorate: o.parent.governorate, city: o.parent.city, total: o.total, promo: o.promo_code ?? "", ref: o.ref ?? "", courier: o.courier_confirmation ?? "" }))
    : (await listEvents()).map((e) => ({ created_at: e.created_at, event: e.event, story_id: e.story_id ?? "", order_id: e.order_id ?? "", tale: e.tale ?? "", gender: e.gender ?? "", child_age: e.child_age ?? "", session_id: e.session_id ?? "", parent_id: e.parent_id ?? "", source: e.source ?? e.ref ?? "", step: e.step ?? "", page: e.page ?? "", meta: e.meta ?? "" }));
  return new NextResponse(csv(rows as Record<string, unknown>[]), { headers: { "content-type": "text/csv", "content-disposition": `attachment; filename=gtales-${what === "orders" ? "orders" : "events"}.csv` } });
}
