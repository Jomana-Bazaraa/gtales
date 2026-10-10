import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isValidAdminCookie } from "@/lib/admin-auth";
import { listBooks, listOrders } from "@/lib/db";
import { listEvents } from "@/lib/events";
import { TALES } from "@/lib/gtales";

/** Admin → Stats (SPEC §13): counters, funnel, by ref and by tale. Every number comes from the events table + books/orders. */
export default async function AdminStats({ searchParams }: PageProps<"/admin/stats">) {
  const store = await cookies();
  if (!isValidAdminCookie(store.get("estoria_admin")?.value)) redirect("/admin/login");
  const sp = await searchParams;
  const range = sp.range === "today" ? "today" : sp.range === "all" ? "all" : "7d";
  const since = range === "today" ? new Date(new Date().toDateString()).toISOString() : range === "7d" ? new Date(Date.now() - 7 * 86_400_000).toISOString() : undefined;
  const [events, books, orders] = await Promise.all([listEvents(since), listBooks(5000), listOrders(5000)]);
  const inRange = <T extends { created_at: string }>(xs: T[]) => xs.filter((x) => !since || x.created_at >= since);
  const B = inRange(books), O = inRange(orders);
  const count = (ev: string) => events.filter((e) => e.event === ev).length;
  const distinct = (ev: string, key: (e: { story_id?: string; order_id?: string }) => string | undefined) => new Set(events.filter((e) => e.event === ev).map(key).filter(Boolean)).size;
  const visitors = count("page_view") || events.length;
  const funnel = [
    ["Visitors (page views)", visitors],
    ["Free form started", count("free_form_step") || B.length],
    ["Story generated", B.length],
    ["Story finished", distinct("story_finished", (e) => e.story_id)],
    ["Series button clicked", count("series_cta_clicked")],
    ["Order submitted", O.length],
    ["Delivered and paid", O.filter((o) => o.status === "delivered_paid").length],
  ] as [string, number][];
  const byTale = TALES.map((t) => ({ t, stories: B.filter((b) => b.slug === t.slug).length, finished: new Set(events.filter((e) => e.event === "story_finished" && e.tale === t.slug).map((e) => e.story_id)).size }));
  const refs = new Map<string, { stories: number; orders: number }>();
  for (const b of B) { const r = b.ref || "direct"; refs.set(r, { ...(refs.get(r) ?? { stories: 0, orders: 0 }), stories: (refs.get(r)?.stories ?? 0) + 1 }); }
  for (const o of O) { const r = o.ref || "direct"; refs.set(r, { ...(refs.get(r) ?? { stories: 0, orders: 0 }), orders: (refs.get(r)?.orders ?? 0) + 1 }); }
  const max = Math.max(1, ...funnel.map((f) => f[1]));
  const Stat = ({ l, v, s }: { l: string; v: number | string; s?: string }) => <div className="card p-4"><span className="eyebrow !text-ink-soft">{l}</span><b className="block display text-[28px]">{v}</b>{s && <span className="text-xs text-ink-soft">{s}</span>}</div>;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Stats</h1>
        <div className="flex gap-2 items-center">
          {(["today", "7d", "all"] as const).map((r) => <a key={r} href={`/admin/stats?range=${r}`} className={`chip !min-h-9 ${range === r ? "chip-on" : ""}`}>{r === "today" ? "Today" : r === "7d" ? "Last 7 days" : "All time"}</a>)}
          <a href="/api/admin/export?what=events" className="btn-ghost !h-9 !px-3 text-sm">Events CSV</a><a href="/api/admin/export?what=orders" className="btn-ghost !h-9 !px-3 text-sm">Orders CSV</a>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat l="Free stories" v={B.length} s={`${B.filter((b) => b.polished).length} polished`} />
        <Stat l="Stories finished" v={funnel[3][1]} />
        <Stat l="PDFs downloaded" v={count("pdf_downloaded")} />
        <Stat l="Series orders" v={O.length} s={`${B.length ? Math.round((O.length / B.length) * 100) : 0}% of stories`} />
        <Stat l="Delivered and paid" v={O.filter((o) => o.status === "delivered_paid").length} s={`${O.filter((o) => o.status === "delivered_paid").reduce((a, o) => a + o.total, 0).toLocaleString()} EGP`} />
        <Stat l="Awaiting approval" v={O.filter((o) => o.status === "awaiting_approval").length} />
        <Stat l="Rate-limited" v={count("rate_limited")} />
        <Stat l="Events" v={events.length} />
      </div>
      <div className="grid md:grid-cols-[1.4fr_1fr] gap-4">
        <div className="card p-4 flex flex-col gap-2"><h2 className="font-bold">Funnel</h2>
          {funnel.map(([l, v], k) => { const prev = k ? funnel[k - 1][1] : v; const drop = prev ? Math.round((1 - v / prev) * 100) : 0; return (
            <div key={l} className="grid grid-cols-[180px_1fr_90px] gap-3 items-center text-sm"><span>{l}</span><div className="h-6 rounded-md bg-sky" style={{ width: `${Math.max(1, (v / max) * 100)}%` }} /><b>{v} {k > 0 && <span className="text-danger text-xs font-bold">−{drop}%</span>}</b></div>
          ); })}
        </div>
        <div className="flex flex-col gap-4">
          <div className="card overflow-hidden"><table className="w-full text-sm"><thead className="bg-surface-tint text-left text-xs uppercase text-ink-soft"><tr><th className="p-2">By channel (ref)</th><th className="p-2">Stories</th><th className="p-2">Orders</th></tr></thead><tbody>{[...refs.entries()].sort((a, b) => b[1].stories - a[1].stories).map(([r, v]) => <tr key={r} className="border-t border-line"><td className="p-2">{r}</td><td className="p-2">{v.stories}</td><td className="p-2">{v.orders}</td></tr>)}</tbody></table></div>
          <div className="card overflow-hidden"><table className="w-full text-sm"><thead className="bg-surface-tint text-left text-xs uppercase text-ink-soft"><tr><th className="p-2">By tale</th><th className="p-2">Stories</th><th className="p-2">Finished</th></tr></thead><tbody>{byTale.map(({ t, stories, finished }) => <tr key={t.slug} className="border-t border-line"><td className="p-2">{t.title}</td><td className="p-2">{stories}</td><td className="p-2">{finished}</td></tr>)}</tbody></table></div>
        </div>
      </div>
      <p className="m-0 text-xs text-ink-soft">Events never hold child names, photos or phone numbers. Visitors = page_view events once the client beacon is on every page; until then the count shows all events.</p>
    </div>
  );
}
