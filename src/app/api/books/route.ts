import { NextResponse, after } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { countRecentBooks, insertBook } from "@/lib/db";
import { logEvent } from "@/lib/events";
import { sendBookEmail } from "@/lib/email";
import { rememberParent } from "@/lib/parents";
import { baseUrl } from "@/lib/site";
import { getSettings } from "@/lib/settings";
import { loadStory } from "@/stories";
import { fillStory, FillError } from "@/stories/fill";
import { polishStory } from "@/stories/polish";
import { assertSafe, SafetyError } from "@/stories/safety";
import { formSchema } from "@/stories/schema";
import { hasImageSet } from "@/stories/images";
import type { BookRecord } from "@/lib/types";

export const maxDuration = 60;

const bodySchema = formSchema.extend({
  parent_name: z.string().trim().min(1).max(60),
  contact: z.string().trim().min(3).max(120),
  ref: z.string().trim().max(60).optional(),
  session_id: z.string().max(60).optional(),
  website: z.string().max(0).optional(), // honeypot
});

/** Make a free story — docs/SPEC.md §7: validate → safety → fillStory → optional polish → ready. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid", issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, { status: 400 });
  const f = parsed.data;
  if (f.website) return NextResponse.json({ id: nanoid(12) });
  // Free story: email only, never a phone number (form brief).
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.contact)) {
    return NextResponse.json({ error: "invalid", issues: [{ path: "email", message: "Please write an email address." }] }, { status: 400 });
  }

  try {
    assertSafe({ name: f.name, place: f.place, other: f.other, strength: f.strength, sidekick: f.sidekick, power_word: f.power_word, dedication: f.dedication });
  } catch (e) {
    if (e instanceof SafetyError) return NextResponse.json({ error: "unsafe", field: e.field, message: e.message }, { status: 422 });
    throw e;
  }

  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = (await getSettings()).rate_limit_per_hour;
  if ((await countRecentBooks(ip, f.contact.toLowerCase())) >= limit) {
    await logEvent({ event: "rate_limited", tale: f.slug, device: ip });
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const story = await loadStory(f.slug);
  if (!story) return NextResponse.json({ error: "coming_soon", message: "This tale is almost ready. Please pick another superpower for now." }, { status: 404 });
  // Never use the boy pictures for a girl (handoff brief, step 2).
  if (!hasImageSet(f.slug, f.gender)) return NextResponse.json({ error: "invalid", issues: [{ path: "gender", message: `The ${f.gender} pictures for this tale are not ready yet.` }] }, { status: 400 });

  // Default from the form brief: sidekick → Bolt.
  const form = {
    ...f,
    sidekick: story.uses.includes("sidekick") ? f.sidekick || "Bolt" : f.sidekick,
  };
  const t0 = Date.now();
  let filled;
  try {
    filled = fillStory(story, form);
  } catch (e) {
    if (e instanceof FillError) return NextResponse.json({ error: "invalid", issues: [{ path: e.token ?? "", message: e.message }] }, { status: 400 });
    throw e;
  }
  const { story: finalStory, polished } = await polishStory(filled, { name: filled.title.split(" ")[0], sidekick: form.sidekick, power_word: form.power_word, place: form.place, other: form.other });

  const id = nanoid(12);
  const now = new Date().toISOString();
  const parent_id = await rememberParent(f.contact, { name: f.parent_name, source: f.ref, first_book_id: id });
  const rec: BookRecord = {
    id, slug: f.slug, title: finalStory.title, gender: f.gender, child_name: finalStory.title.split(" and ")[0],
    form, story: finalStory, polished,
    parent_name: f.parent_name, contact: f.contact.toLowerCase(), dedication: f.dedication, ref: f.ref, ip,
    parent_id, session_id: f.session_id, pdf_url: null, created_at: now, updated_at: now,
  };
  await insertBook(rec);
  await logEvent({ event: "story_created", story_id: id, tale: f.slug, gender: f.gender, child_age: f.age, parent_id, session_id: f.session_id, ref: f.ref, meta: { ms: Date.now() - t0, polished } });
  const site = await baseUrl();
  after(() => sendBookEmail(rec, site).catch((e) => console.error("[email] book", e)));
  return NextResponse.json({ id });
}
