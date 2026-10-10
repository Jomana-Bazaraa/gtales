import { NextResponse } from "next/server";
import { logEvent } from "@/lib/events";

/** Client-side event beacon (SPEC §13). Never accepts names, photos or phone numbers. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.event !== "string") return NextResponse.json({ ok: false }, { status: 400 });
  const allowed = new Set(["page_view", "cta_click", "story_opened", "page_viewed", "challenge_completed", "story_finished", "audio_played", "pdf_downloaded", "share_clicked", "series_cta_clicked", "free_form_step", "order_form_step"]);
  const ref = typeof body.meta?.ref === "string" ? String(body.meta.ref).replace(/[^a-z0-9_-]/gi, "").slice(0, 60) : undefined;
  if (!allowed.has(body.event)) return NextResponse.json({ ok: false }, { status: 400 });
  await logEvent({
    event: body.event,
    story_id: typeof body.story_id === "string" ? body.story_id.slice(0, 40) : undefined,
    page: typeof body.page === "string" ? body.page.slice(0, 60) : typeof body.page === "number" ? String(body.page) : undefined,
    ref,
    meta: typeof body.meta === "object" && body.meta ? body.meta : undefined,
    device: req.headers.get("user-agent")?.slice(0, 120),
  });
  return NextResponse.json({ ok: true });
}
