import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isValidAdminCookie } from "@/lib/admin-auth";
import { listOrders } from "@/lib/db";
import { egpOrFree } from "@/lib/gtales";
import { booksLabel, orderQuantity, STATUS_LABEL } from "@/lib/orders";
import { baseUrl } from "@/lib/site";
import { statusMessage, waLink } from "@/lib/whatsapp";
import type { OrderRecord, OrderStatus } from "@/lib/types";

/** Board columns (Jomana, 24 Oct): each holds one or more order statuses. */
const COLUMNS: { title: string; statuses: OrderStatus[] }[] = [
  { title: "New", statuses: ["ordered", "being_made"] },
  { title: "Preview sent", statuses: ["awaiting_approval"] },
  { title: "Approved", statuses: ["approved"] },
  { title: "Printing", statuses: ["printing", "shipped"] },
  { title: "Delivered", statuses: ["delivered_paid"] },
];
/** The one "move" button per card. */
const MOVE: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  ordered: { to: "awaiting_approval", label: "Preview sent →" },
  being_made: { to: "awaiting_approval", label: "Preview sent →" },
  awaiting_approval: { to: "approved", label: "Approved →" },
  approved: { to: "printing", label: "Printing →" },
  printing: { to: "shipped", label: "With the courier →" },
  shipped: { to: "delivered_paid", label: "Delivered → (deletes photos)" },
};

/** Admin → Series orders board (SPEC §11). */
export default async function AdminSeries() {
  const store = await cookies();
  if (!isValidAdminCookie(store.get("estoria_admin")?.value)) redirect("/admin/login");
  const [orders, base] = await Promise.all([listOrders(500), baseUrl()]);
  const cancelled = orders.filter((o) => o.status === "cancelled");
  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold m-0">Series orders <span className="text-ink-soft text-base font-normal">({orders.length - cancelled.length})</span></h1>
        <a href="/api/admin/export?what=orders_full" className="btn-ghost !h-10 !px-4 text-sm ms-auto">Export CSV</a>
      </div>
      {/* phones: swipe between columns; the page itself never scrolls sideways */}
      <div className="-mx-4 px-4 overflow-x-auto snap-x snap-mandatory md:mx-0 md:px-0 md:overflow-visible">
        <div className="grid grid-flow-col auto-cols-[85%] gap-3 md:grid-flow-row md:grid-cols-5 md:auto-cols-auto">
          {COLUMNS.map((c) => {
            const list = orders.filter((o) => c.statuses.includes(o.status));
            return (
              <section key={c.title} className="snap-start rounded-2xl bg-surface-tint p-2 flex flex-col gap-2 min-w-0">
                <h2 className="m-0 px-1 pt-1 text-sm font-extrabold uppercase tracking-wide text-ink-soft">{c.title} <span className="font-bold">({list.length})</span></h2>
                {list.map((o) => <OrderCard key={o.id} o={o} base={base} />)}
                {!list.length && <p className="m-0 px-1 pb-2 text-sm text-ink-soft">Nothing here.</p>}
              </section>
            );
          })}
        </div>
      </div>
      {cancelled.length > 0 && (
        <details className="mt-6"><summary className="font-bold cursor-pointer">Cancelled ({cancelled.length})</summary>
          <ul className="mt-2 text-sm">{cancelled.map((o) => <li key={o.id}><Link href={`/admin/series/${o.id}`} className="text-sky">{o.id}</Link> · {o.child.name} · {o.parent.name}</li>)}</ul>
        </details>
      )}
    </>
  );
}

function OrderCard({ o, base }: { o: OrderRecord; base: string }) {
  const move = MOVE[o.status];
  return (
    <article className="card !rounded-xl p-3 flex flex-col gap-2 text-sm">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/admin/series/${o.id}`} className="font-extrabold text-sky break-all">{o.id}</Link>
        <span className="text-xs text-ink-soft whitespace-nowrap">{new Date(o.created_at).toLocaleDateString("en-GB", { timeZone: "Africa/Cairo" })}</span>
      </div>
      <div><b>{o.child.name}</b>, {o.child.age} · <b>{booksLabel(orderQuantity(o))}</b> · {o.books.map((b) => b.struggle).join(" · ")}</div>
      <div className="text-ink-soft">{o.parent.name} · {o.parent.city} · {egpOrFree(o.total)}</div>
      <div className="flex flex-wrap gap-1">
        <span className="pill bg-sky-soft text-sky">{STATUS_LABEL[o.status]}</span>
        {o.edit_requested && <span className="pill bg-flame-soft text-flame-deep">edits</span>}
        {o.parent.gift && <span className="pill bg-sun-soft text-ink">🎁 gift{o.parent.gift.hide_price ? " · no price" : ""}</span>}
      </div>
      <a href={waLink(o.parent.whatsapp, statusMessage(o, base))} target="_blank" rel="noreferrer" className="btn-secondary !h-10 !min-h-10 !px-3 text-sm w-full">WhatsApp: {STATUS_LABEL[o.status].toLowerCase()} message</a>
      {move && (
        <form action={`/api/admin/series/${o.id}`} method="post">
          <input type="hidden" name="status" value={move.to} />
          {o.edit_requested && <input type="hidden" name="edit_requested" value="on" />}
          <input type="hidden" name="back" value="/admin/series" />
          <button className="btn-ghost !h-10 !min-h-10 !px-3 text-sm w-full">{move.label}</button>
        </form>
      )}
    </article>
  );
}
