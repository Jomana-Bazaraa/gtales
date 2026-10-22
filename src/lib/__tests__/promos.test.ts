import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// Mock store (no Supabase env in tests) in a throwaway folder: promos.ts reads .data/ under the cwd.
process.chdir(mkdtempSync(path.join(tmpdir(), "gtales-promos-")));
const load = () => import("../promos"); // after chdir, so the module's .data/ path is the temp folder

const base = { code: "X", percent_off: 10, covers_delivery: false, max_uses: null, uses: 0, max_per_phone: null, expires_at: null, active: true };

test("prices: LAUNCH40 = 538, GTALESFAMILY = delivery only (89), a code that covers delivery = 0 delivery", async () => {
  const { promoPrice } = await load();
  assert.deepEqual(promoPrice(749, 89, { percent_off: 40, covers_delivery: false }), { discount: 300, delivery: 89, total: 538 });
  assert.deepEqual(promoPrice(749, 89, { percent_off: 100, covers_delivery: false }), { discount: 749, delivery: 89, total: 89 });
  assert.deepEqual(promoPrice(749, 89, { percent_off: 100, covers_delivery: true }), { discount: 749, delivery: 0, total: 0 });
  assert.deepEqual(promoPrice(749, 89, null), { discount: 0, delivery: 89, total: 838 });
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

test("GTALESFAMILY: 1 per phone (any spelling of the number), use given back on release; LAUNCH40 unlimited", async () => {
  const { checkPromo, promoProblem, redeemPromo, releasePromo, listPromos } = await load();
  const fam = (await listPromos()).find((p) => p.code === "GTALESFAMILY")!;
  assert.deepEqual([fam.percent_off, fam.covers_delivery, fam.max_uses, fam.max_per_phone], [100, false, 30, 1]);
  assert.equal(new Date(fam.expires_at!).toISOString(), "2026-11-05T21:59:59.000Z");
  // the expiry is checked against the real clock; only run the claim flow while the code is live
  if (promoProblem(fam)) return;
  assert.equal((await redeemPromo("gtalesfamily", "+20 100 123 4567", "GT-1")).ok, true, "lower case works");
  const again = await redeemPromo("GTALESFAMILY", "01001234567", "GT-2");
  assert.deepEqual(again, { ok: false, reason: "phone_limit" }, "same number written differently");
  assert.deepEqual(await checkPromo("GTALESFAMILY", "01001234567"), { ok: false, reason: "phone_limit" });
  assert.equal((await checkPromo("GTALESFAMILY", "01112223334")).ok, true, "another number may");
  assert.equal((await listPromos()).find((p) => p.code === "GTALESFAMILY")!.uses, 1);
  await releasePromo("GT-1");
  assert.equal((await listPromos()).find((p) => p.code === "GTALESFAMILY")!.uses, 0);
  assert.equal((await redeemPromo("GTALESFAMILY", "01001234567", "GT-3")).ok, true, "after cancel the number may use it again");
  for (const n of [1, 2, 3]) assert.equal((await redeemPromo("LAUNCH40", "01001234567", `GT-L${n}`)).ok, true);
  assert.deepEqual(await redeemPromo("NOPE", "01001234567", "GT-9"), { ok: false, reason: "invalid" });
});
