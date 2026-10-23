import { NextResponse } from "next/server";
import { getBook } from "@/lib/db";
import { logEvent } from "@/lib/events";

const STORY_EVENTS = new Set(["story_opened", "story_finished", "story_shared", "pdf_downloaded", "challenge_completed"]);

/** Client-side event beacon (SPEC §13). Never accepts names, photos or phone numbers. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.event !== "string") return NextResponse.json({ ok: false }, { status: 400 });
  const allowed = new Set(["review_started", "story_started", "story_shared", "order_started", "page_view", "cta_click", "story_opened", "page_viewed", "challenge_completed", "story_finished", "audio_played", "pdf_downloaded", "share_clicked", "series_cta_clicked", "free_form_step", "order_form_step"]);
  const ref = typeof body.meta?.ref === "string" ? String(body.meta.ref).replace(/[^a-z0-9_-]/gi, "").slice(0, 60) : undefined;
  if (!allowed.has(body.event)) return NextResponse.json({ ok: false }, { status: 400 });
  const story_id = typeof body.story_id === "string" ? body.story_id.slice(0, 40) : undefined;
  // Story events carry the book's slug, gender and age for the Dashboard breakdowns (never the name).
  const book = story_id && STORY_EVENTS.has(body.event) ? await getBook(story_id).catch(() => null) : null;
  await logEvent({
    event: body.event,
    story_id,
    tale: book?.slug ?? (typeof body.meta?.tale === "string" ? String(body.meta.tale).slice(0, 40) : undefined),
    gender: book?.gender,
    child_age: book?.form.age,
    parent_id: book?.parent_id,
    session_id: typeof body.session_id === "string" ? body.session_id.replace(/[^a-z0-9-]/gi, "").slice(0, 60) : undefined,
    page: typeof body.page === "string" ? body.page.slice(0, 60) : typeof body.page === "number" ? String(body.page) : undefined,
    ref,
    meta: typeof body.meta === "object" && body.meta && JSON.stringify(body.meta).length <= 1000 ? body.meta : undefined,
    device: req.headers.get("user-agent")?.slice(0, 120),
  });
  return NextResponse.json({ ok: true });
}
