import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isValidAdminCookie } from "@/lib/admin-auth";
import { listOrders } from "@/lib/db";
import { egp } from "@/lib/gtales";
import { STATUS_LABEL } from "@/lib/orders";

/** Admin → Series orders (SPEC §11). */
export default async function AdminSeries() {
  const store = await cookies();
  if (!isValidAdminCookie(store.get("estoria_admin")?.value)) redirect("/admin/login");
  const orders = await listOrders(300);
  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Series orders <span className="text-ink-soft text-base font-normal">({orders.length})</span></h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-tint text-left text-xs uppercase text-ink-soft"><tr><th className="p-3">Order</th><th className="p-3">Child</th><th className="p-3">Books</th><th className="p-3">Parent</th><th className="p-3">Status</th><th className="p-3">Total</th><th className="p-3"></th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-line align-top">
                <td className="p-3"><b>{o.id}</b><br /><span className="text-ink-soft text-xs">{new Date(o.created_at).toLocaleDateString("en-GB")}</span></td>
                <td className="p-3">{o.child.name}, {o.child.age}, {o.child.gender}</td>
                <td className="p-3">{o.books.map((b) => b.struggle).join(" · ")}</td>
                <td className="p-3">{o.parent.name}<br /><a className="text-sky" href={`https://wa.me/${o.parent.whatsapp.replace(/^0/, "20")}`}>{o.parent.whatsapp}</a></td>
                <td className="p-3"><span className="pill bg-sky-soft text-sky">{STATUS_LABEL[o.status]}</span>{o.edit_requested && <span className="pill bg-flame-soft text-flame-deep ml-1">edits</span>}</td>
                <td className="p-3">{egp(o.total)}</td>
                <td className="p-3"><Link href={`/admin/series/${o.id}`} className="text-sky font-bold">Open</Link></td>
              </tr>
            ))}
            {!orders.length && <tr><td className="p-6 text-ink-soft" colSpan={7}>No Series orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
