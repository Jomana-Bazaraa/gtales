import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isValidAdminCookie } from "@/lib/admin-auth";
import { listPhysicalOrders } from "@/lib/db";

export default async function AdminOrders() {
  const store = await cookies();
  if (!isValidAdminCookie(store.get("estoria_admin")?.value)) redirect("/admin/login");
  const orders = await listPhysicalOrders();
  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Printed-book orders <span className="text-ink-soft text-base font-normal">({orders.filter((o) => o.status === "pending").length} pending)</span></h1>
      <div className="grid gap-3">
        {orders.map((o) => (
          <div key={o.id} className={`card p-4 grid sm:grid-cols-[1fr_1fr_auto] gap-4 ${o.status === "shipped" ? "opacity-60" : ""}`}>
            <div>
              <div className="text-xs text-ink-soft">{new Date(o.created_at).toLocaleString("en-GB", { timeZone: "Africa/Cairo" })} · #{o.id}</div>
              <div className="font-bold text-lg">{o.recipient_name}</div>
              <div>{o.address}</div>
              <div>{o.city}, {o.governorate}</div>
              <div className="font-semibold"><a href={`tel:${o.phone}`} className="text-indigo">{o.phone}</a></div>
              {o.notes && <div className="text-sm text-ink-soft mt-1">{o.notes}</div>}
            </div>
            <div className="text-sm">
              {o.story ? (
                <>
                  <div className="font-semibold">{o.story.assembled?.title ?? o.story.input.childName}</div>
                  <div className="text-ink-soft">Child: {o.story.input.childName} · {o.story.input.language.toUpperCase()}</div>
                  <div className="text-ink-soft">Parent: {o.story.input.parentName} · {o.story.input.parentEmail}</div>
                  <div className="flex gap-3 mt-2">
                    <Link href={`/story/${o.story.id}`} target="_blank" className="text-coral font-bold">Story ↗</Link>
                    {o.story.pdf_color_url && <a href={o.story.pdf_color_url} target="_blank" className="text-coral font-bold">Color PDF ↗</a>}
                    {o.story.pdf_lineart_url && <a href={o.story.pdf_lineart_url} target="_blank" className="text-coral font-bold">Activity PDF ↗</a>}
                  </div>
                </>
              ) : (
                <span className="text-ink-soft">Story {o.story_id} not found</span>
              )}
            </div>
            <form action={`/api/admin/orders/${o.id}`} method="post" className="flex sm:flex-col gap-2 items-start">
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${o.status === "shipped" ? "bg-teal-soft text-teal-900" : o.status === "cancelled" ? "bg-cream-deep" : "bg-coral-soft text-coral-dark"}`}>{o.status}</span>
              {o.status !== "shipped" ? (
                <button name="status" value="shipped" className="btn-secondary !py-2 !min-h-[40px] text-sm">Mark as shipped</button>
              ) : (
                <button name="status" value="pending" className="btn-ghost !py-2 !min-h-[40px] text-sm">Undo</button>
              )}
              {o.status === "pending" && <button name="status" value="cancelled" className="text-xs text-ink-soft underline">Cancel</button>}
            </form>
          </div>
        ))}
        {!orders.length && <div className="card p-8 text-center text-ink-soft">No printed-book orders yet.</div>}
      </div>
    </>
  );
}
