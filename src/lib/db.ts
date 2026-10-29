/**
 * Data layer. Uses Supabase when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set,
 * otherwise a local JSON file store (mock mode, dev only).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import path from "path";
import type { BookRecord, OrderRecord, ParentRecord, PdfJob, PhysicalOrder, StoryRecord } from "./types";

export const isMockDb = !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;

let _sb: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
  if (!_sb) {
    _sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });
  }
  return _sb;
}

// ---------- mock store: one JSON file per record (safe across Next's worker processes) ----------
const DATA_DIR = path.join(process.cwd(), ".data");
type Kind = "stories" | "orders" | "tokens" | "books" | "series" | "parents" | "pdf_jobs";
const dirOf = (kind: Kind) => path.join(DATA_DIR, kind);

async function writeJson(kind: Kind, id: string, data: unknown) {
  const dir = dirOf(kind);
  await fs.mkdir(dir, { recursive: true });
  const final = path.join(dir, `${encodeURIComponent(id)}.json`);
  const tmp = `${final}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, final); // atomic
}
async function readJson<T>(kind: Kind, id: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(path.join(dirOf(kind), `${encodeURIComponent(id)}.json`), "utf8")) as T;
  } catch {
    return null;
  }
}
async function readAll<T extends { created_at: string }>(kind: Kind): Promise<T[]> {
  let files: string[] = [];
  try {
    files = (await fs.readdir(dirOf(kind))).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
  const items: T[] = [];
  for (const f of files) {
    try {
      items.push(JSON.parse(await fs.readFile(path.join(dirOf(kind), f), "utf8")) as T);
    } catch {
      /* skip partial/corrupt file */
    }
  }
  return items.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

// ---------- stories ----------
export async function insertStory(rec: StoryRecord): Promise<void> {
  if (isMockDb) return writeJson("stories", rec.id, rec);
  const { error } = await supabase().from("stories").insert(rec);
  if (error) throw error;
}

export async function updateStory(id: string, patch: Partial<StoryRecord>): Promise<void> {
  patch.updated_at = new Date().toISOString();
  if (isMockDb) {
    const cur = await readJson<StoryRecord>("stories", id);
    if (cur) await writeJson("stories", id, { ...cur, ...patch });
    return;
  }
  const { error } = await supabase().from("stories").update(patch).eq("id", id);
  if (error) throw error;
}

export async function getStory(id: string): Promise<StoryRecord | null> {
  if (isMockDb) return readJson<StoryRecord>("stories", id);
  const { data } = await supabase().from("stories").select("*").eq("id", id).maybeSingle();
  return (data as StoryRecord) ?? null;
}

export async function listStories(limit = 200): Promise<StoryRecord[]> {
  if (isMockDb) return (await readAll<StoryRecord>("stories")).slice(0, limit);
  const { data } = await supabase().from("stories").select("*").order("created_at", { ascending: false }).limit(limit);
  return (data as StoryRecord[]) ?? [];
}

export async function storiesByEmail(email: string): Promise<StoryRecord[]> {
  const e = email.trim().toLowerCase();
  if (isMockDb) return (await readAll<StoryRecord>("stories")).filter((x) => (x.input.parentEmail || "").toLowerCase() === e);
  const { data } = await supabase().from("stories").select("*").eq("input->>parentEmail", e).order("created_at", { ascending: false });
  return (data as StoryRecord[]) ?? [];
}

export async function countRecentByEmailOrIp(email: string, ip: string, windowMinutes = 60): Promise<number> {
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();
  if (isMockDb) {
    const all = await readAll<StoryRecord & { ip?: string }>("stories");
    return all.filter((x) => x.created_at > since && (x.input.parentEmail === email || x.ip === ip)).length;
  }
  const { count } = await supabase()
    .from("stories")
    .select("id", { count: "exact", head: true })
    .gt("created_at", since)
    .or(`input->>parentEmail.eq.${email},ip.eq.${ip}`);
  return count ?? 0;
}

// ---------- physical orders ----------
export async function insertPhysicalOrder(o: PhysicalOrder) {
  if (isMockDb) return writeJson("orders", o.id, o);
  const { error } = await supabase().from("physical_orders").insert(o);
  if (error) throw error;
}

export async function listPhysicalOrders(): Promise<(PhysicalOrder & { story?: StoryRecord })[]> {
  if (isMockDb) {
    const orders = await readAll<PhysicalOrder>("orders");
    return Promise.all(orders.map(async (o) => ({ ...o, story: (await readJson<StoryRecord>("stories", o.story_id)) ?? undefined })));
  }
  const { data } = await supabase().from("physical_orders").select("*, story:stories(*)").order("created_at", { ascending: false });
  return (data as (PhysicalOrder & { story?: StoryRecord })[]) ?? [];
}

export async function updatePhysicalOrder(id: string, patch: Partial<PhysicalOrder>) {
  if (isMockDb) {
    const cur = await readJson<PhysicalOrder>("orders", id);
    if (cur) await writeJson("orders", id, { ...cur, ...patch });
    return;
  }
  const { error } = await supabase().from("physical_orders").update(patch).eq("id", id);
  if (error) throw error;
}

// ---------- magic links ----------
export async function saveMagicToken(token: string, email: string) {
  if (isMockDb) return writeJson("tokens", token, { email });
  const { error } = await supabase().from("magic_tokens").insert({ token, email, expires_at: new Date(Date.now() + 86_400_000).toISOString() });
  if (error) throw error;
}
export async function consumeMagicToken(token: string): Promise<string | null> {
  if (isMockDb) return (await readJson<{ email: string }>("tokens", token))?.email ?? null;
  const { data } = await supabase().from("magic_tokens").select("email, expires_at").eq("token", token).maybeSingle();
  if (!data || data.expires_at < new Date().toISOString()) return null;
  return data.email;
}

// ---------- storage ----------
export async function readMockFile(key: string): Promise<Buffer | null> {
  const safe = path.normalize(key).replace(/^(\.\.[/\\])+/, "");
  try {
    return await fs.readFile(path.join(DATA_DIR, "files", safe));
  } catch {
    return null;
  }
}

/** Stores a binary; returns a public URL. Mock mode writes to .data/files and serves via /api/files. */
export async function putFile(key: string, bytes: Buffer, contentType: string): Promise<string> {
  if (isMockDb) {
    const dir = path.join(DATA_DIR, "files", path.dirname(key));
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(DATA_DIR, "files", key), bytes);
    return `/api/files/${key}`;
  }
  const bucket = key.endsWith(".pdf") ? "pdfs" : "covers";
  const { error } = await supabase().storage.from(bucket).upload(key, bytes, { contentType, upsert: true });
  if (error) throw error;
  return supabase().storage.from(bucket).getPublicUrl(key).data.publicUrl;
}

// ---------- books (GTales free stories, SPEC §7) ----------
export async function insertBook(rec: BookRecord): Promise<void> {
  if (isMockDb) return writeJson("books", rec.id, rec);
  const { error } = await supabase().from("books").insert(rec);
  if (error) throw error;
}
export async function updateBook(id: string, patch: Partial<BookRecord>): Promise<void> {
  if (isMockDb) {
    const cur = await readJson<BookRecord>("books", id);
    if (cur) await writeJson("books", id, { ...cur, ...patch, updated_at: new Date().toISOString() });
    return;
  }
  const { error } = await supabase().from("books").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}
export async function getBook(id: string): Promise<BookRecord | null> {
  if (isMockDb) return readJson<BookRecord>("books", id);
  const { data } = await supabase().from("books").select("*").eq("id", id).maybeSingle();
  return (data as BookRecord) ?? null;
}
export async function listBooks(limit = 200): Promise<BookRecord[]> {
  if (isMockDb) return (await readAll<BookRecord>("books")).slice(0, limit);
  const { data } = await supabase().from("books").select("*").order("created_at", { ascending: false }).limit(limit);
  return (data as BookRecord[]) ?? [];
}
export async function countRecentBooks(ip: string, contact: string, windowMinutes = 60): Promise<number> {
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();
  if (isMockDb) {
    const all = await readAll<BookRecord & { ip?: string }>("books");
    return all.filter((x) => x.created_at > since && (x.ip === ip || (contact && x.contact === contact))).length;
  }
  const { count } = await supabase().from("books").select("id", { count: "exact", head: true }).gt("created_at", since).or(`ip.eq.${ip},contact.eq.${contact || "-"}`);
  return count ?? 0;
}

// ---------- Series orders (SPEC §9–10) ----------
export async function insertOrder(o: OrderRecord): Promise<void> {
  if (isMockDb) return writeJson("series", o.id, o);
  const { error } = await supabase().from("orders").insert(o);
  if (error && /'(quantity|language)' column/.test(error.message ?? "")) {
    // Migration 0007 / 0009 not run yet (no orders.quantity / orders.language): never lose the order; keep the value
    // inside `parent` (jsonb) for now (re-running the migration moves it into its column).
    let row: Record<string, unknown> = { ...o };
    let err: { message?: string } | null = error;
    for (let k = 0; k < 2 && err; k++) {
      const col = err.message?.match(/'(quantity|language)' column/)?.[1] as "quantity" | "language" | undefined;
      if (!col) break;
      console.error(`[orders] no orders.${col} column: run ${col === "quantity" ? "0007_order_quantity" : "0009_order_language"}.sql`);
      const { [col]: v, ...rest } = row;
      row = { ...rest, parent: { ...(rest.parent as object), [col]: v } };
      err = (await supabase().from("orders").insert(row)).error;
    }
    if (err) throw err;
    return;
  }
  if (error) throw error;
}
export async function updateOrder(id: string, patch: Partial<OrderRecord>): Promise<void> {
  if (isMockDb) {
    const cur = await readJson<OrderRecord>("series", id);
    if (cur) await writeJson("series", id, { ...cur, ...patch, updated_at: new Date().toISOString() });
    return;
  }
  const { error } = await supabase().from("orders").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}
export async function getOrder(id: string): Promise<OrderRecord | null> {
  if (isMockDb) return readJson<OrderRecord>("series", id);
  const { data } = await supabase().from("orders").select("*").eq("id", id).maybeSingle();
  return (data as OrderRecord) ?? null;
}
export async function listOrders(limit = 300): Promise<OrderRecord[]> {
  if (isMockDb) return (await readAll<OrderRecord>("series")).slice(0, limit);
  const { data } = await supabase().from("orders").select("*").order("created_at", { ascending: false }).limit(limit);
  return (data as OrderRecord[]) ?? [];
}
export async function ordersByWhatsapp(whatsapp: string): Promise<OrderRecord[]> {
  if (isMockDb) return (await readAll<OrderRecord>("series")).filter((o) => o.parent.whatsapp === whatsapp);
  const { data } = await supabase().from("orders").select("*").eq("parent->>whatsapp", whatsapp).order("created_at", { ascending: false });
  return (data as OrderRecord[]) ?? [];
}

/** Private photos (hero, loved ones): never a public URL. Read back through signed URLs for admin only. */
export async function putPrivatePhoto(key: string, bytes: Buffer, contentType: string): Promise<string> {
  if (isMockDb) {
    const dir = path.join(DATA_DIR, "photos", path.dirname(key));
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(DATA_DIR, "photos", key), bytes);
    return key;
  }
  const { error } = await supabase().storage.from("photos").upload(key, bytes, { contentType, upsert: true });
  if (error) throw error;
  return key;
}
export async function privatePhotoUrl(key: string): Promise<string> {
  if (isMockDb) return `/api/admin/photos/${key}`;
  const { data } = await supabase().storage.from("photos").createSignedUrl(key, 3600);
  return data?.signedUrl ?? "";
}
export async function readPrivatePhoto(key: string): Promise<Buffer | null> {
  try { return await fs.readFile(path.join(DATA_DIR, "photos", key)); } catch { return null; }
}
export async function deletePrivatePhotos(keys: string[]): Promise<void> {
  if (!keys.length) return;
  if (isMockDb) { for (const k of keys) await fs.rm(path.join(DATA_DIR, "photos", k), { force: true }); return; }
  await supabase().storage.from("photos").remove(keys);
}

// ---------- parents (users, LAUNCH-PLAN §1b) ----------
/** Creates the parent on first sight; later calls only fill in what was missing (first book/order stays the first). */
export async function upsertParent(p: Omit<ParentRecord, "created_at" | "updated_at">): Promise<void> {
  const now = new Date().toISOString();
  if (isMockDb) {
    const cur = await readJson<ParentRecord>("parents", p.id);
    const merged = { ...p, ...Object.fromEntries(Object.entries(cur ?? {}).filter(([, v]) => v != null)) } as ParentRecord;
    return writeJson("parents", p.id, { ...merged, created_at: cur?.created_at ?? now, updated_at: now });
  }
  const { data: cur } = await supabase().from("parents").select("*").eq("id", p.id).maybeSingle();
  if (!cur) {
    const { error } = await supabase().from("parents").insert({ ...p, created_at: now, updated_at: now });
    if (!error || error.code !== "23505") { if (error) throw error; return; } // 23505: inserted by a parallel request
  }
  const fill = Object.fromEntries(Object.entries(p).filter(([k, v]) => v != null && (cur as Record<string, unknown> | null)?.[k] == null));
  if (Object.keys(fill).length) await supabase().from("parents").update({ ...fill, updated_at: now }).eq("id", p.id);
}
export async function countParents(sinceIso?: string): Promise<number> {
  if (isMockDb) return (await readAll<ParentRecord>("parents")).filter((x) => !sinceIso || x.created_at >= sinceIso).length;
  let q = supabase().from("parents").select("id", { count: "exact", head: true });
  if (sinceIso) q = q.gte("created_at", sinceIso);
  const { count } = await q;
  return count ?? 0;
}

// ---------- PDF jobs (rendered by the GitHub Action, LAUNCH-PLAN §1) ----------
export async function insertPdfJob(j: PdfJob): Promise<void> {
  if (isMockDb) return writeJson("pdf_jobs", j.id, j);
  const { error } = await supabase().from("pdf_jobs").insert(j);
  if (error) throw error;
}
export async function updatePdfJob(id: string, patch: Partial<PdfJob>): Promise<void> {
  const p = { ...patch, updated_at: new Date().toISOString() };
  if (isMockDb) {
    const cur = await readJson<PdfJob>("pdf_jobs", id);
    if (cur) await writeJson("pdf_jobs", id, { ...cur, ...p });
    return;
  }
  const { error } = await supabase().from("pdf_jobs").update(p).eq("id", id);
  if (error) throw error;
}
export async function latestPdfJob(bookId: string): Promise<PdfJob | null> {
  if (isMockDb) return (await readAll<PdfJob>("pdf_jobs")).find((j) => j.book_id === bookId) ?? null;
  const { data } = await supabase().from("pdf_jobs").select("*").eq("book_id", bookId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return (data as PdfJob) ?? null;
}
export async function listPdfJobs(limit = 500): Promise<PdfJob[]> {
  if (isMockDb) return (await readAll<PdfJob>("pdf_jobs")).slice(0, limit);
  const { data } = await supabase().from("pdf_jobs").select("*").order("created_at", { ascending: false }).limit(limit);
  return (data as PdfJob[]) ?? [];
}
