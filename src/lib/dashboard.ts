/**
 * Admin → Dashboard numbers (fixnow A6). Supabase: one call to the SQL function gtales_dashboard (migration 0008),
 * which counts and sums inside the database: "All time" has no date limit and no row limit.
 * Mock mode (local .data/), or Supabase before 0008 is run: the same numbers computed here from rows,
 * flagged `partial` on Supabase because only the newest rows can be fetched.
 */
import { countParents, isMockDb, listBooks, listOrders, supabase } from "./db";
import { listEvents, type StoredEvent } from "./events";
import { orderQuantity } from "./orders";
import type { BookRecord, OrderRecord } from "./types";

export const RANGES = [["today", "Today"], ["7d", "7 days"], ["30d", "30 days"], ["all", "All time"]] as const;
export type Range = (typeof RANGES)[number][0];
export const parseRange = (v: unknown): Range => (v === "today" || v === "7d" || v === "30d" ? v : "all"); // default: All time

const DAY = 86_400_000;
/** Start of the range (null = all time). "Today" starts at Cairo midnight, so it matches the team's day. */
export function rangeStart(r: Range): string | null {
  if (r === "all") return null;
  if (r === "7d") return new Date(Date.now() - 7 * DAY).toISOString();
  if (r === "30d") return new Date(Date.now() - 30 * DAY).toISOString();
  const cairo = new Date().toLocaleString("en-CA", { timeZone: "Africa/Cairo", hour12: false }).slice(0, 10);
  const offset = new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo", timeZoneName: "longOffset" }).match(/GMT([+-]\d{2}:\d{2})/)?.[1] ?? "+02:00";
  return new Date(`${cairo}T00:00:00${offset}`).toISOString();
}

export interface Breakdown { dim: "story" | "gender" | "age" | "source"; k: string; created: number; finished: number; orders: number; books: number; revenue: number }
export interface DashboardStats {
  first_record: string | null; // the first book, order or event ever
  first_events: Record<string, string>; // event name → first time it was recorded
  sessions: number; unique_devices: number; builder_starts: number; free_stories: number; finished: number; shared: number;
  orders: number; books_ordered: number; revenue: number; delivered_revenue: number;
  reviews_started: number; reviews_submitted: number; reviews_approved: number;
  landing: number; start_click: number; step1: number; step2: number; converted: number; parents: number; parents_new: number;
  breakdowns: Breakdown[]; source_visitors: Record<string, number>;
  promos: { code: string; orders: number; books: number; discount: number; revenue: number }[];
  partial?: string; // why the numbers may be incomplete (shown on the dashboard)
}

export async function dashboardStats(range: Range): Promise<DashboardStats> {
  const since = rangeStart(range);
  if (!isMockDb) {
    const { data, error } = await supabase().rpc("gtales_dashboard", { p_since: since });
    if (!error && data) return data as DashboardStats;
    console.error("[dashboard] gtales_dashboard failed (run migration 0008):", error?.message);
  }
  const [events, books, orders, parents, parentsNew] = await Promise.all([listEvents(), listBooks(100_000), listOrders(100_000), countParents(), countParents(since ?? undefined)]);
  const stats = fromRows(since, events, books, orders, parents, parentsNew);
  if (!isMockDb) stats.partial = "Migration 0008 is not run in Supabase, so these numbers come from the newest rows only (events: last 20,000 in the database). Run supabase/migrations/0008_dashboard_stats.sql for complete all-time numbers.";
  return stats;
}

/** The same numbers as the SQL function, from rows (mock mode, or the fallback above). Kept in step with 0008. */
export function fromRows(since: string | null, allEvents: StoredEvent[], allBooks: BookRecord[], allOrders: OrderRecord[], parents: number, parentsNew: number): DashboardStats {
  const inRange = <T extends { created_at: string }>(xs: T[]) => xs.filter((x) => !since || x.created_at >= since);
  const ev = inRange(allEvents), bk = inRange(allBooks), oa = inRange(allOrders);
  const slugOf = new Map(allBooks.map((b) => [b.id, b.slug]));
  const od = oa.filter((o) => o.status !== "cancelled");
  const fin = new Set(ev.filter((e) => e.event === "story_finished" && e.story_id).map((e) => e.story_id!));
  const sessionsOf = (pred: (e: StoredEvent) => boolean) => new Set(ev.filter((e) => pred(e) && e.session_id).map((e) => e.session_id)).size;
  const cairoDay = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
  const firstEvents: Record<string, string> = {};
  for (const e of allEvents) if (!firstEvents[e.event] || e.created_at < firstEvents[e.event]) firstEvents[e.event] = e.created_at;
  const firsts = [...allBooks, ...allOrders, ...allEvents].map((x) => x.created_at).sort();
  const sum = (xs: OrderRecord[], f: (o: OrderRecord) => number) => xs.reduce((a, o) => a + f(o), 0);

  const rows = new Map<string, Breakdown>();
  const add = (dim: Breakdown["dim"], k: string | number | undefined | null, d: Partial<Breakdown>) => {
    if (k == null || k === "") return;
    const key = `${dim}|${k}`;
    const r = rows.get(key) ?? { dim, k: String(k), created: 0, finished: 0, orders: 0, books: 0, revenue: 0 };
    for (const f of ["created", "finished", "orders", "books", "revenue"] as const) r[f] += d[f] ?? 0;
    rows.set(key, r);
  };
  for (const b of bk) {
    const f = fin.has(b.id) ? 1 : 0;
    add("story", b.slug, { created: 1, finished: f }); add("gender", b.gender, { created: 1, finished: f }); add("age", b.form?.age, { created: 1, finished: f });
    add("source", b.ref || "direct", { created: 1 });
  }
  for (const o of od) {
    const d = { orders: 1, books: orderQuantity(o), revenue: o.total };
    add("story", o.free_story_id ? slugOf.get(o.free_story_id) : undefined, d); add("gender", o.child.gender, d); add("age", o.child.age, d); add("source", o.ref || "direct", d);
  }
  const sourceVisitors: Record<string, Set<string>> = {};
  for (const e of ev) { const k = e.source || e.ref; if (k && e.session_id) (sourceVisitors[k] ??= new Set()).add(e.session_id); }
  const promos = new Map<string, DashboardStats["promos"][number]>();
  for (const o of od) {
    const code = o.promo_code || "(no code)";
    const p = promos.get(code) ?? { code, orders: 0, books: 0, discount: 0, revenue: 0 };
    p.orders++; p.books += orderQuantity(o); p.discount += o.discount; p.revenue += o.total;
    promos.set(code, p);
  }
  const ordered = new Set(allOrders.filter((o) => o.status !== "cancelled").map((o) => o.free_story_id).filter(Boolean));
  return {
    first_record: firsts[0] ?? null,
    first_events: firstEvents,
    sessions: new Set(ev.filter((e) => e.session_id).map((e) => `${e.session_id}|${cairoDay(e.created_at)}`)).size,
    unique_devices: sessionsOf(() => true),
    builder_starts: ev.filter((e) => e.event === "story_started").length,
    free_stories: bk.length,
    finished: fin.size,
    shared: ev.filter((e) => e.event === "story_shared" || e.event === "share_clicked").length,
    orders: od.length,
    books_ordered: sum(od, orderQuantity),
    revenue: sum(od, (o) => o.total),
    delivered_revenue: sum(oa.filter((o) => o.status === "delivered_paid"), (o) => o.total),
    reviews_started: ev.filter((e) => e.event === "review_started").length,
    reviews_submitted: ev.filter((e) => e.event === "review_submitted").length,
    reviews_approved: ev.filter((e) => e.event === "review_approved").length,
    landing: sessionsOf((e) => e.event === "landing_view"),
    start_click: sessionsOf((e) => e.event === "start_click"),
    step1: sessionsOf((e) => e.event === "story_started" || e.event === "form_step_1"),
    step2: sessionsOf((e) => (e.event === "free_form_step" && (e.meta as { name?: string } | undefined)?.name === "review") || e.event === "form_step_2"),
    converted: bk.filter((b) => ordered.has(b.id)).length,
    parents, parents_new: parentsNew,
    breakdowns: [...rows.values()],
    source_visitors: Object.fromEntries(Object.entries(sourceVisitors).map(([k, v]) => [k, v.size])),
    promos: [...promos.values()],
  };
}

/** TOTAL STORIES = free stories + books ordered (SUM of quantity). Same formula wherever a total is shown. */
export const totalStories = (s: Pick<DashboardStats, "free_stories" | "books_ordered">) => s.free_stories + s.books_ordered;

/**
 * Public homepage counter (U7): TOTAL STORIES, all time. Database counts via gtales_dashboard (0008); before 0008,
 * an exact count of books plus the books in non-cancelled orders (orders are few). Throws when nothing works:
 * the route then answers 503 and the counter stays hidden.
 */
export async function publicTotalStories(): Promise<number> {
  if (isMockDb) return totalStories(fromRows(null, [], await listBooks(100_000), await listOrders(100_000), 0, 0));
  const { data, error } = await supabase().rpc("gtales_dashboard", { p_since: null });
  if (!error && data) return totalStories(data as DashboardStats);
  const books = await supabase().from("books").select("id", { count: "exact", head: true });
  if (books.error || books.count == null) throw books.error ?? new Error("books count");
  const pick = (cols: string) => supabase().from("orders").select(cols).neq("status", "cancelled").limit(10_000);
  let rows = await pick("quantity, parent, status");
  if (rows.error) rows = await pick("parent, status"); // before 0007
  if (rows.error) throw rows.error;
  const ordered = (rows.data as unknown as Pick<OrderRecord, "quantity" | "parent">[]).reduce((a, o) => a + orderQuantity(o), 0);
  return books.count + ordered;
}
