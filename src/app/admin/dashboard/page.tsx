import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isValidAdminCookie } from "@/lib/admin-auth";
import { countParents, listBooks, listOrders } from "@/lib/db";
import { listEvents, type StoredEvent } from "@/lib/events";
import { TALES } from "@/lib/gtales";
import { listPromos, promoProblem } from "@/lib/promos";
import type { BookRecord, OrderRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;
const RANGES = [["today", "Today"], ["7d", "7 days"], ["30d", "30 days"]] as const;
type Range = (typeof RANGES)[number][0];
/** Cairo midnight, so "today" matches the team's day. */
function since(r: Range): string {
  if (r === "7d") return new Date(Date.now() - 7 * DAY).toISOString();
  if (r === "30d") return new Date(Date.now() - 30 * DAY).toISOString();
  const cairo = new Date().toLocaleString("en-CA", { timeZone: "Africa/Cairo", hour12: false }).slice(0, 10);
  const offset = new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo", timeZoneName: "longOffset" }).match(/GMT([+-]\d{2}:\d{2})/)?.[1] ?? "+02:00";
  return new Date(`${cairo}T00:00:00${offset}`).toISOString();
}
const live = (o: OrderRecord) => o.status !== "cancelled";
const egp = (n: number) => `${n.toLocaleString("en-US")} EGP`;
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");

function metrics(ev: StoredEvent[], books: BookRecord[], orders: OrderRecord[]) {
  const sessions = new Set(ev.map((e) => e.session_id).filter(Boolean));
  const distinct = (type: string) => new Set(ev.filter((e) => e.event === type).map((e) => e.story_id).filter(Boolean)).size;
  const placed = orders.filter(live);
  return {
    visitors: sessions.size || ev.filter((e) => e.event === "page_view").length,
    started: ev.filter((e) => e.event === "story_started").length,
    created: books.length,
    finished: distinct("story_finished"),
    shared: ev.filter((e) => e.event === "story_shared" || e.event === "share_clicked").length,
    orders: placed.length,
    revenue: placed.reduce((a, o) => a + o.total, 0),
    delivered: orders.filter((o) => o.status === "delivered_paid").reduce((a, o) => a + o.total, 0),
  };
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="p-2 text-left">{children}</th>;
}
function Table({ title, head, rows }: { title: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="card overflow-x-auto"><table className="w-full text-sm">
      <thead className="bg-surface-tint text-xs uppercase text-ink-soft"><tr><Th>{title}</Th>{head.map((h) => <Th key={h}>{h}</Th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i} className="border-t border-line">{r.map((c, j) => <td key={j} className={`p-2 ${j ? "tabular-nums" : ""}`}>{c}</td>)}</tr>)}
        {!rows.length && <tr><td className="p-3 text-ink-soft" colSpan={head.length + 1}>Nothing yet.</td></tr>}</tbody>
    </table></div>
  );
}

/** Admin → Dashboard (LAUNCH-PLAN §1b, SPEC §13). Books and orders are the truth for counts; events add sessions, finishes and shares. */
export default async function AdminDashboard({ searchParams }: PageProps<"/admin/dashboard">) {
  const store = await cookies();
  if (!isValidAdminCookie(store.get("estoria_admin")?.value)) redirect("/admin/login");
  const sp = await searchParams;
  const range: Range = sp.range === "today" || sp.range === "7d" ? sp.range : "30d";
  const from30 = since("30d");
  const [events, allBooks, allOrders, parents, parentsNew, promoCodes] = await Promise.all([listEvents(from30), listBooks(5000), listOrders(5000), countParents(), countParents(since(range)), listPromos()]);
  const pick = <T extends { created_at: string }>(xs: T[], r: Range) => xs.filter((x) => x.created_at >= since(r));
  const cols = RANGES.map(([r, label]) => ({ r, label, m: metrics(pick(events, r), pick(allBooks, r), pick(allOrders, r)) }));

  // Breakdowns and conversion for the selected range.
  const B = pick(allBooks, range), O = pick(allOrders, range), E = pick(events, range);
  const bookById = new Map(allBooks.map((b) => [b.id, b]));
  const orderedBooks = new Set(allOrders.filter(live).map((o) => o.free_story_id).filter(Boolean));
  const converted = B.filter((b) => orderedBooks.has(b.id)).length;
  const finishedIds = new Set(E.filter((e) => e.event === "story_finished").map((e) => e.story_id));
  const group = <K extends string | number>(keys: K[], bookKey: (b: BookRecord) => K, orderKey: (o: OrderRecord) => K | undefined) =>
    keys.map((k) => {
      const bs = B.filter((b) => bookKey(b) === k);
      const os = O.filter(live).filter((o) => orderKey(o) === k);
      return { k, created: bs.length, finished: bs.filter((b) => finishedIds.has(b.id)).length, orders: os.length, revenue: os.reduce((a, o) => a + o.total, 0) };
    });
  const byStory = group(TALES.map((t) => t.slug), (b) => b.slug, (o) => (o.free_story_id ? bookById.get(o.free_story_id)?.slug : undefined));
  const byGender = group(["boy", "girl"], (b) => b.gender, (o) => o.child.gender);
  const byAge = group([2, 3, 4, 5, 6, 7, 8, 9, 10], (b) => b.form.age, (o) => o.child.age);
  const sources = new Map<string, { visitors: Set<string>; created: number; orders: number; revenue: number }>();
  const src = (k?: string) => { const key = k || "direct"; if (!sources.has(key)) sources.set(key, { visitors: new Set(), created: 0, orders: 0, revenue: 0 }); return sources.get(key)!; };
  for (const e of E) if (e.session_id && (e.source || e.ref)) src(e.source || e.ref).visitors.add(e.session_id);
  for (const b of B) src(b.ref).created++;
  for (const o of O.filter(live)) { const s = src(o.ref); s.orders++; s.revenue += o.total; }
  // Promo codes: rules and lifetime uses from promo_codes; orders, discount given and revenue in the chosen range
  const cairo = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { timeZone: "Africa/Cairo", day: "numeric", month: "short", year: "numeric" });
  const status = (p: (typeof promoCodes)[number]) => ({ invalid: "Off", not_started: "Not started", expired: "Expired", used_up: "Used up", phone_limit: "" })[promoProblem(p) ?? "phone_limit"] || "Active";
  const promoRows = [...promoCodes.map((p) => p.code), ...(O.some((o) => live(o) && !o.promo_code) ? ["(no code)"] : [])].map((code) => {
    const p = promoCodes.find((x) => x.code === code);
    const os = O.filter(live).filter((o) => (o.promo_code || "(no code)") === code);
    return [
      code,
      p ? `${p.percent_off === 100 ? "Books free" : `${p.percent_off}% off`}${p.covers_delivery ? " + delivery" : ""}` : "—",
      p ? `${p.uses}${p.max_uses != null ? ` / ${p.max_uses}` : ""}` : "—",
      p?.max_per_phone != null ? `${p.max_per_phone} per phone` : "—",
      p?.expires_at ? cairo(p.expires_at) : "—",
      p ? status(p) : "—",
      os.length,
      egp(os.reduce((a, o) => a + o.discount, 0)),
      egp(os.reduce((a, o) => a + o.total, 0)),
    ];
  });
  const taleTitle = (slug: string) => TALES.find((t) => t.slug === slug)?.title ?? slug;
  const m = metrics(E, B, O);
  const funnel: [string, number][] = [["Visitors", m.visitors], ["Free form opened", m.started], ["Story created", m.created], ["Story finished", m.finished], ["Shared", m.shared], ["Order placed", m.orders]];
  const max = Math.max(1, ...funnel.map((f) => f[1]));

  const breakdown = (title: string, rows: ReturnType<typeof group>, label: (k: string | number) => string) =>
    <Table title={title} head={["Created", "Finished", "Orders", "Created → ordered", "Revenue"]} rows={rows.map((r) => [label(r.k), r.created, r.finished, r.orders, pct(r.orders, r.created), egp(r.revenue)])} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2 items-center flex-wrap">
          <a href="/api/admin/export?what=events" className="btn-ghost !h-9 !px-3 text-sm">Events CSV</a>
          <a href="/api/admin/export?what=orders" className="btn-ghost !h-9 !px-3 text-sm">Orders CSV</a>
        </div>
      </div>

      <Table title="" head={cols.map((c) => c.label)} rows={[
        ["Visitors (unique sessions)", ...cols.map((c) => c.m.visitors)],
        ["Stories created", ...cols.map((c) => c.m.created)],
        ["Stories finished", ...cols.map((c) => c.m.finished)],
        ["Stories shared", ...cols.map((c) => c.m.shared)],
        ["Orders (not cancelled)", ...cols.map((c) => c.m.orders)],
        ["Revenue, orders placed (cash on delivery)", ...cols.map((c) => egp(c.m.revenue))],
        ["Revenue, delivered and paid", ...cols.map((c) => egp(c.m.delivered))],
      ]} />

      <div className="flex gap-2 items-center flex-wrap">
        <span className="text-sm font-bold text-ink-soft">Breakdowns for</span>
        {RANGES.map(([r, label]) => <a key={r} href={`/admin/dashboard?range=${r}`} className={`chip !min-h-9 ${range === r ? "chip-on" : ""}`}>{label}</a>)}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[["Created → ordered", pct(converted, B.length), `${converted} of ${B.length} free stories led to an order`],
          ["Orders per story", pct(m.orders, m.created), "all orders ÷ stories created"],
          ["Parents (users)", parents, `${parentsNew} new in this range`],
          ["Finished", pct(m.finished, m.created), "of stories created"]].map(([l, v, s]) => (
          <div key={l} className="card p-4"><span className="eyebrow !text-ink-soft">{l}</span><b className="block display text-[28px]">{v}</b><span className="text-xs text-ink-soft">{s}</span></div>
        ))}
      </div>
      <div className="card p-4 flex flex-col gap-2"><h2 className="font-bold">Funnel</h2>
        {funnel.map(([l, v], k) => { const prev = k ? funnel[k - 1][1] : v; return (
          <div key={l} className="grid grid-cols-[140px_1fr_80px] md:grid-cols-[180px_1fr_90px] gap-3 items-center text-sm"><span>{l}</span><div className="h-6 rounded-md bg-sky" style={{ width: `${Math.max(1, (v / max) * 100)}%` }} /><b>{v} {k > 0 && prev > 0 && <span className="text-danger text-xs font-bold">{pct(v, prev)}</span>}</b></div>
        ); })}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {breakdown("By story", byStory, (k) => taleTitle(String(k)))}
        {breakdown("By gender", byGender, (k) => String(k))}
        {breakdown("By age", byAge, (k) => String(k))}
        <div className="flex flex-col gap-4">
          <Table title="Top sources" head={["Visitors", "Stories", "Orders", "Revenue"]} rows={[...sources.entries()].sort((a, b) => b[1].orders - a[1].orders || b[1].created - a[1].created).slice(0, 15).map(([k, v]) => [k, v.visitors.size, v.created, v.orders, egp(v.revenue)])} />
        </div>
      </div>
      <Table title="Promo codes" head={["Offer", "Uses (all time)", "Limit", "Expires", "Status", "Orders in range", "Discount given", "Revenue"]} rows={promoRows} />
      <p className="m-0 text-xs text-ink-soft">Orders by story count only orders that came from a free story. Sources come from <code>?ref=</code>, <code>?utm_source=</code> or <code>?code=</code> on the first visit. Page views and countries: Cloudflare Web Analytics. Events never hold child names.</p>
    </div>
  );
}
