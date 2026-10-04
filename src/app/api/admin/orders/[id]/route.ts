import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isValidAdminCookie } from "@/lib/admin-auth";
import { updatePhysicalOrder } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const store = await cookies();
  if (!isValidAdminCookie(store.get("estoria_admin")?.value)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await params;
  const form = await req.formData();
  const status = String(form.get("status"));
  if (!["pending", "shipped", "cancelled"].includes(status)) return NextResponse.json({ error: "bad status" }, { status: 400 });
  await updatePhysicalOrder(id, { status: status as "pending" | "shipped" | "cancelled", shipped_at: status === "shipped" ? new Date().toISOString() : null });
  return NextResponse.redirect(new URL("/admin/orders", req.url), 303);
}
