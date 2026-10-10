import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { insertOrder } from "@/lib/db";
import { logEvent } from "@/lib/events";
import { priceBreakdown } from "@/lib/gtales";
import { assertSafe, SafetyError } from "@/stories/safety";
import type { OrderRecord } from "@/lib/types";

const person = z.object({ who: z.string().trim().min(1).max(20), name: z.string().trim().min(1).max(20), description: z.string().trim().max(200).optional(), photo_key: z.string().max(80).optional() });
const book = z.object({ struggle: z.string().trim().min(2).max(60), context: z.string().trim().max(200).optional(), people: z.array(person).max(4).default([]), setting: z.string().trim().max(120).optional() });

const schema = z.object({
  child: z.object({ name: z.string().trim().min(1).max(14).regex(/^[A-Za-z][A-Za-z '\-]*$/), age: z.number().int().min(4).max(8), gender: z.enum(["boy", "girl"]) }),
  photos: z.object({ face: z.string().min(1).max(80), body: z.string().max(80).optional() }),
  strengths: z.array(z.string().trim().min(1).max(40)).min(1).max(12),
  books: z.array(book).min(1).max(3),
  world: z.object({ favourites: z.array(z.string().trim().min(1).max(40)).max(20).default([]), notes: z.string().trim().max(300).optional() }),
  words: z.object({ parent: z.string().trim().max(120).optional(), child: z.string().trim().max(120).optional(), nicknames: z.string().trim().max(120).optional() }),
  dedication: z.string().trim().max(200).optional(),
  activities: z.array(z.string().trim().max(40)).max(12).default([]),
  parent: z.object({ name: z.string().trim().min(2).max(60), whatsapp: z.string().trim().regex(/^\+?[0-9 ]{10,16}$/), governorate: z.string().trim().min(2).max(40), city: z.string().trim().min(2).max(60), street: z.string().trim().min(3).max(200), landmark: z.string().trim().max(120).optional(), best_time: z.string().trim().max(40).optional() }),
  promo_code: z.string().trim().max(30).optional(),
  free_story_id: z.string().max(40).optional(),
  ref: z.string().trim().max(60).optional(),
  website: z.string().max(0).optional(),
});

/** Series order submit (SPEC §9). Pay on delivery: nothing is charged here. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid", issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, { status: 400 });
  const o = parsed.data;
  if (o.website) return NextResponse.json({ id: nanoid(10) });
  try {
    assertSafe({ name: o.child.name, dedication: o.dedication, ...Object.fromEntries(o.books.flatMap((b, i) => [[`book_${i + 1}`, b.struggle], [`setting_${i + 1}`, b.setting], ...b.people.map((p, k) => [`person_${i + 1}_${k + 1}`, `${p.name} ${p.description ?? ""}`])])) });
  } catch (e) {
    if (e instanceof SafetyError) return NextResponse.json({ error: "unsafe", field: e.field, message: "Please choose another word." }, { status: 422 });
    throw e;
  }
  const p = priceBreakdown();
  const promoOk = (o.promo_code ?? "").toUpperCase() === p.promoCode.toUpperCase();
  const discount = promoOk ? p.discount : 0;
  const now = new Date().toISOString();
  const id = `GT-${1000 + Math.floor(Math.random() * 9000)}-${nanoid(4).toUpperCase()}`;
  const rec: OrderRecord = {
    id, status: "ordered", edit_requested: false,
    child: o.child, photos: o.photos, strengths: o.strengths, books: o.books, world: o.world, words: o.words,
    dedication: o.dedication, activities: o.activities, parent: { ...o.parent, whatsapp: o.parent.whatsapp.replace(/\s+/g, "") },
    promo_code: promoOk ? p.promoCode : undefined, list_price: p.listPrice, discount, delivery: p.delivery, total: p.listPrice - discount + p.delivery,
    free_story_id: o.free_story_id, ref: o.ref, photos_deleted_at: null, created_at: now, updated_at: now,
  };
  await insertOrder(rec);
  await logEvent({ event: "order_submitted", order_id: id, ref: o.ref, meta: { books: o.books.length, promo: rec.promo_code ?? null } });
  return NextResponse.json({ id, total: rec.total });
}
