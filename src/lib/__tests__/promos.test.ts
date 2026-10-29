import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// Mock store (no Supabase env in tests) in a throwaway folder: promos.ts reads .data/ under the cwd.
process.chdir(mkdtempSync(path.join(tmpdir(), "gtales-promos-")));
const load = () => import("../promos"); // after chdir, so the module's .data/ path is the temp folder

const base = { code: "X", percent_off: 10, covers_delivery: false, max_uses: null, uses: 0, max_per_phone: null, expires_at: null, active: true };

test("prices per book (fixnow A2): 249 − 40% = 149.4 → 149 per book, delivery 89 once per order", async () => {
  const { promoPrice } = await load();
  const { bookPrice, priceBreakdown } = await import("../gtales");
  assert.equal(bookPrice(249, 40), 149, "149.4 rounds to 149");
  assert.equal(bookPrice(249, 30), 174, "174.3 rounds to 174");
  assert.equal(bookPrice(250, 40), 150);
  assert.deepEqual(promoPrice(249, 89, { percent_off: 40, covers_delivery: false }, 2), { unit: 149, discount: 200, delivery: 89, total: 387 }, "2 × 149 + 89");
  assert.equal(promoPrice(249, 89, { percent_off: 40, covers_delivery: false }, 3).total, 536, "3 × 149 + 89");
  assert.equal(promoPrice(249, 89, { percent_off: 40, covers_delivery: false }, 100).total, 14989, "delivery once, not per book");
  assert.deepEqual(promoPrice(249, 89, { percent_off: 100, covers_delivery: false }, 3), { unit: 0, discount: 747, delivery: 89, total: 89 });
  assert.deepEqual(promoPrice(249, 89, { percent_off: 100, covers_delivery: true }, 3), { unit: 0, discount: 747, delivery: 0, total: 0 });
  assert.deepEqual(promoPrice(249, 89, null, 1), { unit: 249, discount: 0, delivery: 89, total: 338 });
  const b = priceBreakdown({ listPrice: 249, promoCode: "LAUNCH40", promoPercent: 40, delivery: 89 }, 2);
  assert.deepEqual([b.net, b.books, b.total], [149, 298, 387]);
});

test("rules: inactive, not started, expired, used up", async () => {
  const { promoProblem } = await load();
  const now = new Date("2026-10-22T12:00:00Z");
  assert.equal(promoProblem(null, now), "invalid");
  assert.equal(promoProblem({ ...base, active: false }, now), "invalid");
  assert.equal(promoProblem({ ...base, starts_at: "2026-11-01T00:00:00Z" }, now), "not_started");
  assert.equal(promoProblem({ ...base, expires_at: "2026-10-22T11:59:59Z" }, now), "expired");
  assert.equal(promoProblem({ ...base, max_uses: 30, uses: 30 }, now), "used_up");
  assert.equal(promoProblem({ ...base, max_uses: 30, uses: 29, expires_at: "2026-11-05T23:59:59+02:00" }, now), null);
});

test("GTALESFAMILY: free, up to 5 per phone (any spelling of the number), use given back on release; LAUNCH40 alongside", async () => {
  const { checkPromo, promoPrice, promoProblem, redeemPromo, releasePromo, listPromos } = await load();
  const fam = (await listPromos()).find((p) => p.code === "GTALESFAMILY")!;
  assert.deepEqual([fam.percent_off, fam.covers_delivery, fam.max_uses, fam.max_per_phone], [100, true, 30, 5]);
  assert.equal(promoPrice(249, 89, fam, 3).total, 0, "free: books and delivery");
  assert.equal(new Date(fam.expires_at!).toISOString(), "2026-11-05T21:59:59.000Z");
  // the expiry is checked against the real clock; only run the claim flow while the code is live
  if (promoProblem(fam)) return;
  assert.equal((await redeemPromo("gtalesfamily", "+20 100 123 4567", "GT-1")).ok, true, "lower case works");
  for (const n of [2, 3, 4, 5]) assert.equal((await redeemPromo("GTALESFAMILY", "01001234567", `GT-${n}`)).ok, true, `use ${n} of 5`);
  const again = await redeemPromo("GTALESFAMILY", "01001234567", "GT-6");
  assert.deepEqual(again, { ok: false, reason: "phone_limit" }, "6th use, same number written differently");
  assert.deepEqual(await checkPromo("GTALESFAMILY", "01001234567"), { ok: false, reason: "phone_limit" });
  assert.equal((await checkPromo("GTALESFAMILY", "01112223334")).ok, true, "another number may");
  assert.equal((await listPromos()).find((p) => p.code === "GTALESFAMILY")!.uses, 5);
  await releasePromo("GT-1");
  assert.equal((await listPromos()).find((p) => p.code === "GTALESFAMILY")!.uses, 4);
  assert.equal((await redeemPromo("GTALESFAMILY", "01001234567", "GT-7")).ok, true, "after a cancel the number may use it again");
  for (const n of [1, 2, 3]) assert.equal((await redeemPromo("LAUNCH40", "01001234567", `GT-L${n}`)).ok, true);
  assert.deepEqual(await redeemPromo("NOPE", "01001234567", "GT-9"), { ok: false, reason: "invalid" });
});
