import { NextResponse, after } from "next/server";
import { z } from "zod";
import { sendReviewNotice } from "@/lib/email";
import { logEvent } from "@/lib/events";
import { taleBySlug } from "@/lib/gtales";
import { reviewFields } from "@/lib/review-schema";
import { checkTicket, checkUploaded, countReviewsSince, errText, hashIp, insertReview, LIMITS, newReviewId, type Review } from "@/lib/reviews";
import { baseUrl } from "@/lib/site";
import { assertSafe, SafetyError } from "@/stories/safety";

const body = reviewFields.extend({
  device_id: z.string().regex(/^[a-z0-9-]{8,60}$/i),
  ticket: z.string().max(200),
  consent_display: z.literal(true, { message: "Please tick both boxes." }),
  consent_removal: z.literal(true, { message: "Please tick both boxes." }),
  website: z.string().max(0).optional(), // honeypot
});

/** Step 3: save the review as pending (never public until approved in Admin → Reviews). */
export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) { const i = parsed.error.issues[0]; return NextResponse.json({ error: "invalid", field: String(i.path[0] ?? ""), message: i.message }, { status: 400 }); }
  const b = parsed.data;
  if (b.website) return NextResponse.json({ ok: true });
  if (!checkTicket(b.ticket, b.device_id)) return NextResponse.json({ error: "ticket", message: "This page was open too long. Please send again." }, { status: 403 });
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash = hashIp(ip);
  if ((await countReviewsSince(b.device_id, ipHash, new Date(Date.now() - 86_400_000).toISOString())) >= LIMITS.perDevicePerDay)
    return NextResponse.json({ error: "rate_limited", message: "You've sent a lot of reviews today. Please try again tomorrow." }, { status: 429 });
  try {
    assertSafe({ text: b.text, first_name: b.first_name, city: b.city });
  } catch (e) {
    if (e instanceof SafetyError) return NextResponse.json({ error: "unsafe", field: e.field, message: "Please change a word or two and send again." }, { status: 422 });
    throw e;
  }
  const photos = b.media.filter((m) => m.type === "image"), videos = b.media.filter((m) => m.type === "video");
  if (photos.length > LIMITS.photos || videos.length > LIMITS.videos) return NextResponse.json({ error: "invalid", message: "Up to 3 photos and 1 video." }, { status: 400 });
  for (const m of b.media) {
    if (!/^pending\/\d{4}-\d{2}-\d{2}\/[\w-]{16}\.(jpg|png|webp|mp4|mov)$/.test(m.path) || !(await checkUploaded(m)))
      return NextResponse.json({ error: "media", message: "One of the files didn't upload. Please try again." }, { status: 400 });
  }
  const now = new Date().toISOString();
  const rec: Review = {
    id: newReviewId(), created_at: now, updated_at: now, rating: b.rating, text: b.text, first_name: b.first_name, city: b.city ?? null,
    child_age: b.child_age ?? null, story_slug: b.story_slug && taleBySlug(b.story_slug) ? b.story_slug : null, media: b.media,
    consent_at: now, status: "pending", featured: false, source: "form", approved_at: null, device_id: b.device_id, ip_hash: ipHash,
  };
  try {
    await insertReview(rec);
  } catch (e) {
    console.error("[reviews] insert failed (is migration 0005 run?):", errText(e));
    return NextResponse.json({ error: "unavailable", message: "Sorry, reviews can't be saved right now. Please try again later." }, { status: 503 });
  }
  await logEvent({ event: "review_submitted", tale: rec.story_slug ?? undefined, child_age: rec.child_age ?? undefined, session_id: b.device_id, meta: { rating: rec.rating, photos: photos.length, video: videos.length } });
  const site = await baseUrl();
  after(() => sendReviewNotice(rec, site).catch((e) => console.error("[email] review", e)));
  return NextResponse.json({ ok: true });
}
