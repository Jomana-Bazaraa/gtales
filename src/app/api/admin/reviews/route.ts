import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { isValidAdminCookie } from "@/lib/admin-auth";
import { logEvent } from "@/lib/events";
import { taleBySlug } from "@/lib/gtales";
import { reviewFields } from "@/lib/review-schema";
import { errText, checkUploaded, insertReview, LIMITS, newReviewId, type Review } from "@/lib/reviews";

const body = reviewFields.extend({
  consent_confirmed: z.literal(true, { message: "Tick the box to confirm the parent agreed." }),
  status: z.enum(["approved", "pending"]).default("approved"),
});

/** Admin adds a review by hand (source = admin), e.g. one a parent sent on WhatsApp. */
export async function POST(req: Request) {
  const store = await cookies();
  if (!isValidAdminCookie(store.get("estoria_admin")?.value)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) { const i = parsed.error.issues[0]; return NextResponse.json({ error: "invalid", field: String(i.path[0] ?? ""), message: i.message }, { status: 400 }); }
  const b = parsed.data;
  if (b.media.filter((m) => m.type === "image").length > LIMITS.photos || b.media.filter((m) => m.type === "video").length > LIMITS.videos)
    return NextResponse.json({ error: "invalid", message: "Up to 3 photos and 1 video." }, { status: 400 });
  for (const m of b.media) {
    if (!/^admin\/\d{4}-\d{2}-\d{2}\/[\w-]{16}\.(jpg|png|webp|mp4|mov)$/.test(m.path) || !(await checkUploaded(m)))
      return NextResponse.json({ error: "media", message: "One of the files didn't upload. Please try again." }, { status: 400 });
  }
  const now = new Date().toISOString();
  const rec: Review = {
    id: newReviewId(), created_at: now, updated_at: now, rating: b.rating, text: b.text, first_name: b.first_name, city: b.city ?? null,
    child_age: b.child_age ?? null, story_slug: b.story_slug && taleBySlug(b.story_slug) ? b.story_slug : null, media: b.media,
    consent_at: now, status: b.status, featured: false, source: "admin", approved_at: b.status === "approved" ? now : null,
  };
  try {
    await insertReview(rec);
  } catch (e) {
    console.error("[reviews] admin insert failed:", errText(e));
    return NextResponse.json({ error: "unavailable", message: `Database error: ${errText(e)}. Is migration 0005 run in Supabase?` }, { status: 503 });
  }
  if (rec.status === "approved") await logEvent({ event: "review_approved", meta: { review: rec.id, rating: rec.rating, source: "admin" } });
  return NextResponse.json({ ok: true, id: rec.id });
}
