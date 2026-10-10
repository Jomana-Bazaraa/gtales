/**
 * Data layer. Uses Supabase when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set,
 * otherwise a local JSON file store (mock mode, dev only).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import path from "path";
import type { PhysicalOrder, StoryRecord } from "./types";

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
const dirOf = (kind: "stories" | "orders" | "tokens") => path.join(DATA_DIR, kind);

async function writeJson(kind: "stories" | "orders" | "tokens", id: string, data: unknown) {
  const dir = dirOf(kind);
  await fs.mkdir(dir, { recursive: true });
  const final = path.join(dir, `${encodeURIComponent(id)}.json`);
  const tmp = `${final}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, final); // atomic
}
async function readJson<T>(kind: "stories" | "orders" | "tokens", id: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(path.join(dirOf(kind), `${encodeURIComponent(id)}.json`), "utf8")) as T;
  } catch {
    return null;
  }
}
async function readAll<T extends { created_at: string }>(kind: "stories" | "orders"): Promise<T[]> {
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
