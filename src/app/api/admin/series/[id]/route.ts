import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isValidAdminCookie } from "@/lib/admin-auth";
import { deletePrivatePhotos, getOrder, updateOrder } from "@/lib/db";
import { logEvent } from "@/lib/events";
import { STATUS_ORDER } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types";

/** Admin status / notes update. Photos are deleted on delivered_paid or cancelled (SPEC §12.2). */
export async function POST(req: Request, { params }: RouteContext<"/api/admin/series/[id]">) {
  const store = await cookies();
  if (!isValidAdminCookie(store.get("estoria_admin")?.value)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await params;
  const o = await getOrder(id);
  if (!o) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const form = await req.formData();
  const patch: Record<string, unknown> = {};
  if (form.has("status")) {
    const status = String(form.get("status")) as OrderStatus;
    if (![...STATUS_ORDER, "cancelled"].includes(status)) return NextResponse.json({ error: "bad status" }, { status: 400 });
    patch.status = status;
    patch.edit_requested = form.get("edit_requested") === "on";
    if (status !== o.status) await logEvent({ event: "status_changed", order_id: id, meta: { from: o.status, to: status } });
    if ((status === "delivered_paid" || status === "cancelled") && !o.photos_deleted_at) {
      const keys = [o.photos.face, ...o.books.flatMap((b) => b.people.map((p) => p.photo_key))].filter(Boolean) as string[];
      await deletePrivatePhotos(keys);
      patch.photos_deleted_at = new Date().toISOString();
      await logEvent({ event: "photos_deleted", order_id: id, meta: { count: keys.length } });
    }
  }
  if (form.has("notes")) patch.notes = String(form.get("notes")).slice(0, 2000);
  if (form.has("courier_confirmation")) patch.courier_confirmation = String(form.get("courier_confirmation")).slice(0, 200);
  await updateOrder(id, patch);
  return NextResponse.redirect(new URL(`/admin/series/${id}`, req.url), 303);
}
