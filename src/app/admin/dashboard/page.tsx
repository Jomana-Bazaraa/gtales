import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isValidAdminCookie } from "@/lib/admin-auth";
import { dashboardStats, parseRange, rangeStart, RANGES, totalStories, type Breakdown } from "@/lib/dashboard";
import { TALES } from "@/lib/gtales";
import { listPromos, promoProblem } from "@/lib/promos";

export const dynamic = "force-dynamic";

const egp = (n: number) => `${n.toLocaleString("en-US")} EGP`;
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");
const cairo = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { timeZone: "Africa/Cairo", day: "numeric", month: "short", year: "numeric" });

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

/**
 * Admin → Dashboard (SPEC §13, fixnow A6). Every number and table follows one range switch; default All time.
 * Numbers come from the database as counts and sums (src/lib/dashboard.ts → SQL function gtales_dashboard, migration 0008).
 */
export default async function AdminDashboard({ searchParams }: PageProps<"/admin/dashboard">) {
  const store = await cookies();
  if (!isValidAdminCookie(store.get("estoria_admin")?.value)) redirect("/admin/login");
  const sp = await searchParams;
  const range = parseRange(sp.range);
  const start = rangeStart(range);
  const [s, promoCodes] = await Promise.all([dashboardStats(range), listPromos()]);

  /**
   * Event-based numbers only exist since that event was first recorded. When the range starts before that
   * (and the site already had books or orders then), say so instead of passing off a partial count.
   */
  const tracked = (...events: string[]): string | null => {
    const firsts = events.map((e) => s.first_events[e]).filter(Boolean).sort();
    if (!firsts.length) return "not tracked yet";
    const first = firsts[0];
    const startsBefore = !start || start < first;
    const dataBefore = !!s.first_record && new Date(first).getTime() - new Date(s.first_record).getTime() > 86_400_000;
    return startsBefore && dataBefore ? `tracked since ${cairo(first)}` : null;
  };
  const sessionsNote = tracked("page_view", "landing_view", "story_started");
  const total = totalStories(s);
  const cards: { label: string; value: string | number; sub: string; note?: string | null; strong?: boolean }[] = [
    { label: "Sessions", value: s.sessions, sub: "visits, not unique: one device on one Cairo day", note: sessionsNote },
    { label: "Builder starts", value: s.builder_starts, sub: "free story form opened", note: tracked("story_started") },
    { label: "Free stories created", value: s.free_stories, sub: "books table" },
    { label: "Orders", value: s.orders, sub: "not cancelled" },
    { label: "Books ordered", value: s.books_ordered, sub: "paid stories: sum of books in those orders" },
    { label: "Total stories", value: total, sub: `free ${s.free_stories} + ordered ${s.books_ordered}`, strong: true },
    { label: "Revenue", value: egp(s.revenue), sub: "sum of order totals (cash on delivery)" },
  ];
  const conversion: [string, number, number, string | null][] = [
    ["Sessions → builder starts", s.builder_starts, s.sessions, sessionsNote],
    ["Builder starts → free stories", s.free_stories, s.builder_starts, tracked("story_started")],
    ["Free stories → orders", s.orders, s.free_stories, null],
    ["Sessions → orders", s.orders, s.sessions, sessionsNote],
  ];

  const funnel: [string, number][] = [["Sessions", s.sessions], ["Saw the home page", s.landing], ["Tapped start", s.start_click], ["Opened the form", s.step1], ["Reached the last page", s.step2], ["Story created", s.free_stories], ["Story finished", s.finished], ["Order placed", s.orders]];
  const max = Math.max(1, ...funnel.map((f) => f[1]));

  const dim = (d: Breakdown["dim"]) => s.breakdowns.filter((b) => b.dim === d);
  const zero = (k: string): Breakdown => ({ dim: "story", k, created: 0, finished: 0, orders: 0, books: 0, revenue: 0 });
  const byStory = TALES.map((t) => dim("story").find((b) => b.k === t.slug) ?? zero(t.slug));
  const byGender = ["boy", "girl"].map((g) => dim("gender").find((b) => b.k === g) ?? zero(g));
  const byAge = [2, 3, 4, 5, 6, 7, 8, 9, 10].map((a) => dim("age").find((b) => b.k === String(a)) ?? zero(String(a)));
  const taleTitle = (slug: string) => TALES.find((t) => t.slug === slug)?.title ?? slug;
  const breakdown = (title: string, rows: Breakdown[], label: (k: string) => string) =>
    <Table title={title} head={["Created", "Finished", "Orders", "Books", "Created → ordered", "Revenue"]} rows={rows.map((r) => [label(r.k), r.created, r.finished, r.orders, r.books, pct(r.orders, r.created), egp(r.revenue)])} />;
  const sourceKeys = [...new Set([...dim("source").map((b) => b.k), ...Object.keys(s.source_visitors)])];
  const sources = sourceKeys.map((k) => ({ ...(dim("source").find((b) => b.k === k) ?? zero(k)), visitors: s.source_visitors[k] ?? 0 }))
    .sort((a, b) => b.orders - a.orders || b.created - a.created || b.visitors - a.visitors).slice(0, 15);

  // Promo codes: rules and lifetime uses from promo_codes; orders, books, discount and revenue in the chosen range
  const status = (p: (typeof promoCodes)[number]) => ({ invalid: "Off", not_started: "Not started", expired: "Expired", used_up: "Used up", phone_limit: "" })[promoProblem(p) ?? "phone_limit"] || "Active";
  const promoRows = [...new Set([...promoCodes.map((p) => p.code), ...s.promos.map((p) => p.code)])].map((code) => {
    const p = promoCodes.find((x) => x.code === code);
    const u = s.promos.find((x) => x.code === code);
    return [
      code,
      p ? (p.percent_off === 100 && p.covers_delivery ? "Free (books + delivery)" : `${p.percent_off === 100 ? "Books free" : `${p.percent_off}% off`}${p.covers_delivery ? " + free delivery" : ""}`) : "—",
      p ? `${p.uses}${p.max_uses != null ? ` / ${p.max_uses}` : ""}` : "—",
      p?.max_per_phone != null ? `${p.max_per_phone} per phone` : "—",
      p?.expires_at ? cairo(p.expires_at) : "—",
      p ? status(p) : "—",
      u?.orders ?? 0, u?.books ?? 0, egp(u?.discount ?? 0), egp(u?.revenue ?? 0),
    ];
  });
  const rangeLabel = RANGES.find(([r]) => r === range)![1];
  const note = (n: string | null | undefined) => n && <span className="block text-[11px] font-bold text-flame-deep">{n}</span>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div><h1 className="text-2xl font-bold m-0">Dashboard</h1><p className="m-0 text-sm text-ink-soft">{s.first_record ? `Since ${cairo(s.first_record)} (first record)` : "No records yet"}</p></div>
        <div className="flex gap-2 items-center flex-wrap">
          <a href="/api/admin/export?what=events" className="btn-ghost !h-9 !px-3 text-sm">Events CSV</a>
          <a href="/api/admin/export?what=orders" className="btn-ghost !h-9 !px-3 text-sm">Orders CSV</a>
        </div>
      </div>
      <nav aria-label="Range" className="flex gap-2 items-center flex-wrap">
        {RANGES.map(([r, label]) => <a key={r} href={r === "all" ? "/admin/dashboard" : `/admin/dashboard?range=${r}`} aria-current={range === r ? "page" : undefined} className={`chip !min-h-9 ${range === r ? "chip-on" : ""}`}>{label}</a>)}
      </nav>
      {s.partial && <p role="alert" className="m-0 rounded-xl bg-flame-soft text-flame-deep p-3 text-sm font-bold">{s.partial}</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className={`card p-4 ${c.strong ? "border-flame" : ""}`}>
            <span className="eyebrow !text-ink-soft">{c.label}</span>
            <b className="block display text-[28px] leading-9">{c.value}</b>
            <span className="text-xs text-ink-soft">{c.sub}</span>{note(c.note)}
          </div>
        ))}
      </div>
      <div className="card p-4 flex flex-col gap-2"><h2 className="font-bold m-0">Conversion · {rangeLabel}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {conversion.map(([l, a, b, n]) => <div key={l}><span className="text-xs font-bold text-ink-soft">{l}</span><b className="block display text-[24px]">{pct(a, b)}</b><span className="text-xs text-ink-soft">{a} of {b}</span>{note(n)}</div>)}
        </div>
      </div>

      <Table title={rangeLabel} head={["Number", "Note"]} rows={[
        ["Devices (unique)", s.unique_devices, sessionsNote ?? ""],
        ["Stories finished", s.finished, tracked("story_finished") ?? ""],
        ["Stories shared", s.shared, tracked("story_shared", "share_clicked") ?? ""],
        ["Revenue, delivered and paid", egp(s.delivered_revenue), ""],
        ["Free stories that led to an order", `${s.converted} (${pct(s.converted, s.free_stories)})`, ""],
        ["Parents (users), all time", s.parents, `${s.parents_new} new in this range`],
        ["Review form opened", s.reviews_started, tracked("review_started") ?? ""],
        ["Reviews submitted", s.reviews_submitted, tracked("review_submitted") ?? ""],
        ["Reviews approved", s.reviews_approved, tracked("review_approved") ?? ""],
      ]} />

      <div className="card p-4 flex flex-col gap-2"><h2 className="font-bold m-0">Funnel · {rangeLabel}</h2>
        {sessionsNote && <span className="text-xs font-bold text-flame-deep">Visit steps: {sessionsNote}</span>}
        {funnel.map(([l, v], k) => { const prev = k ? funnel[k - 1][1] : v; return (
          <div key={l} className="grid grid-cols-[140px_1fr_80px] md:grid-cols-[180px_1fr_90px] gap-3 items-center text-sm"><span>{l}</span><div className="h-6 rounded-md bg-sky" style={{ width: `${Math.max(1, (v / max) * 100)}%` }} /><b>{v} {k > 0 && prev > 0 && <span className="text-danger text-xs font-bold">{pct(v, prev)}</span>}</b></div>
        ); })}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {breakdown("By story", byStory, taleTitle)}
        {breakdown("By gender", byGender, (k) => k)}
        {breakdown("By age", byAge, (k) => k)}
        <Table title="Top sources" head={["Visitors", "Stories", "Orders", "Books", "Revenue"]} rows={sources.map((v) => [v.k, v.visitors, v.created, v.orders, v.books, egp(v.revenue)])} />
      </div>
      <Table title="Promo codes" head={["Offer", "Uses (all time)", "Limit", "Expires", "Status", "Orders", "Books", "Discount given", "Revenue"]} rows={promoRows} />
      <p className="m-0 text-xs text-ink-soft">Range: {rangeLabel}{start ? ` (from ${cairo(start)})` : " (no date or row limit)"}. Orders by story count only orders that came from a free story. Sources come from <code>?ref=</code>, <code>?utm_source=</code> or <code>?code=</code> on the first visit. Page views and countries: Cloudflare Web Analytics.</p>
    </div>
  );
}
