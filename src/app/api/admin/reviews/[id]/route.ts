import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isValidAdminCookie } from "@/lib/admin-auth";
import { logEvent } from "@/lib/events";
import { deleteReview, getReview, updateReview } from "@/lib/reviews";
import { baseUrl } from "@/lib/site";

/** Admin → Reviews buttons: approve · hide · feature · unfeature · delete (also deletes the media files). */
export async function POST(req: Request, { params }: RouteContext<"/api/admin/reviews/[id]">) {
  const store = await cookies();
  if (!isValidAdminCookie(store.get("estoria_admin")?.value)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const f = await req.formData();
  const action = String(f.get("action") ?? "");
  const back = String(f.get("back") ?? "/admin/reviews").replace(/[^\w/?=&-]/g, "").slice(0, 80) || "/admin/reviews";
  const r = await getReview(id);
  if (!r) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const now = new Date().toISOString();
  if (action === "approve") {
    await updateReview(id, { status: "approved", approved_at: r.approved_at ?? now });
    if (r.status !== "approved") await logEvent({ event: "review_approved", meta: { review: id, rating: r.rating, source: r.source } });
  } else if (action === "hide") await updateReview(id, { status: "hidden", featured: false });
  else if (action === "feature") {
    await updateReview(id, { featured: true, status: "approved", approved_at: r.approved_at ?? now }); // pin to top (approves too)
    if (r.status !== "approved") await logEvent({ event: "review_approved", meta: { review: id, rating: r.rating, source: r.source } });
  }
  else if (action === "unfeature") await updateReview(id, { featured: false });
  else if (action === "delete") await deleteReview(id);
  else return NextResponse.json({ error: "action" }, { status: 400 });
  return NextResponse.redirect(new URL(back.startsWith("/admin/reviews") ? back : "/admin/reviews", await baseUrl()), 303);
}
