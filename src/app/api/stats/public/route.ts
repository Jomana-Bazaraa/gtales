import { NextResponse } from "next/server";
import { publicTotalStories } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

/** Homepage counter (U7): only { totalStories }, cached 5 minutes here and in browsers/CDN. 503 on failure (counter hides). */
let cache: { at: number; v: number } | null = null;
const FIVE_MIN = 300_000;

export async function GET() {
  try {
    if (!cache || Date.now() - cache.at > FIVE_MIN) cache = { at: Date.now(), v: await publicTotalStories() };
    return NextResponse.json({ totalStories: cache.v }, { headers: { "cache-control": "public, max-age=300, s-maxage=300" } });
  } catch (e) {
    console.error("[stats/public]", e instanceof Error ? e.message : JSON.stringify(e));
    return NextResponse.json({ error: "unavailable" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
