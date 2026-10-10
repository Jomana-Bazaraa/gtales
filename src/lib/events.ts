/**
 * Events table (SPEC §13). Every meaningful action, timestamped server-side.
 * Rows never hold child names, photos or phone numbers.
 */
import { isMockDb, supabase } from "./db";
import { promises as fs } from "fs";
import path from "path";

export interface EventRow {
  event: string;
  story_id?: string;
  order_id?: string;
  tale?: string;
  step?: number;
  ref?: string;
  page?: string;
  device?: string;
  visitor_id?: string;
  session_id?: string;
  meta?: Record<string, unknown>;
}

export async function logEvent(e: EventRow): Promise<void> {
  const row = { ...e, created_at: new Date().toISOString() };
  try {
    if (isMockDb) {
      const dir = path.join(process.cwd(), ".data");
      await fs.mkdir(dir, { recursive: true });
      await fs.appendFile(path.join(dir, "events.ndjson"), JSON.stringify(row) + "\n");
      return;
    }
    await supabase().from("events").insert(row);
  } catch (err) {
    console.error("[events]", err);
  }
}

export interface StoredEvent extends EventRow { created_at: string }
/** Read events for the Stats tab (mock: ndjson file; Supabase: events table). */
export async function listEvents(sinceIso?: string): Promise<StoredEvent[]> {
  if (isMockDb) {
    try {
      const raw = await fs.readFile(path.join(process.cwd(), ".data", "events.ndjson"), "utf8");
      return raw.split("\n").filter(Boolean).map((l) => JSON.parse(l) as StoredEvent).filter((e) => !sinceIso || e.created_at >= sinceIso);
    } catch { return []; }
  }
  let q = supabase().from("events").select("*").order("created_at", { ascending: false }).limit(20000);
  if (sinceIso) q = q.gte("created_at", sinceIso);
  const { data } = await q;
  return (data as StoredEvent[]) ?? [];
}
