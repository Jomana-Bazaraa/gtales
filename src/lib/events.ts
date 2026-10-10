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
