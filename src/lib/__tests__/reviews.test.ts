import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// Mock store in a throwaway folder (reviews.ts keeps .data/ under the cwd).
process.chdir(mkdtempSync(path.join(tmpdir(), "gtales-reviews-")));
const load = () => import("../reviews");
const schema = () => import("../review-schema");

test("tickets: valid for the same device only, and not forged", async () => {
  const { issueTicket, checkTicket } = await load();
  const t = issueTicket("device-aaaa1111");
  assert.equal(checkTicket(t, "device-aaaa1111"), true);
  assert.equal(checkTicket(t, "device-bbbb2222"), false);
  assert.equal(checkTicket(`${Date.now() + 60_000}.forged`, "device-aaaa1111"), false);
  assert.equal(checkTicket(undefined, "device-aaaa1111"), false);
});

test("form fields: required rating/text/name, 5000 chars max, names with Arabic letters ok", async () => {
  const { reviewFields } = await schema();
  const ok = { rating: 5, text: "Loved it", first_name: "Mona", media: [] };
  assert.equal(reviewFields.safeParse(ok).success, true);
  assert.equal(reviewFields.safeParse({ ...ok, first_name: "منى", city: "المعادي" }).success, true);
  assert.equal(reviewFields.safeParse({ ...ok, rating: 0 }).success, false);
  assert.equal(reviewFields.safeParse({ ...ok, text: "x".repeat(5001) }).success, false);
  assert.equal(reviewFields.safeParse({ ...ok, first_name: "<script>" }).success, false);
  assert.equal(reviewFields.safeParse({ ...ok, city: "" }).success, true, "empty city is fine");
});

test("public reviews: only approved, featured first; pending media never signed; delete removes files", async () => {
  const r = await load();
  const mk = (id: string, status: "pending" | "approved" | "hidden", created: string, featured = false, media: { type: "image" | "video"; path: string }[] = []) => ({
    id, created_at: created, updated_at: created, rating: 5, text: id, first_name: "Mona", city: "Maadi", child_age: 6, story_slug: null, media,
    consent_at: created, status, featured, source: "form" as const, approved_at: status === "approved" ? created : null, device_id: "dev1", ip_hash: "ip1",
  });
  const file = (p: string) => { const f = r.mockMediaFile(p); mkdirSync(path.dirname(f), { recursive: true }); writeFileSync(f, "x"); return p; };
  await r.insertReview(mk("old", "approved", "2026-10-01T00:00:00Z"));
  await r.insertReview(mk("new", "approved", "2026-10-20T00:00:00Z", false, [{ type: "image", path: file("pending/2026-10-20/aaaaaaaaaaaaaaaa.jpg") }]));
  await r.insertReview(mk("pin", "approved", "2026-09-01T00:00:00Z", true));
  await r.insertReview(mk("wait", "pending", "2026-10-21T00:00:00Z", false, [{ type: "video", path: file("pending/2026-10-21/bbbbbbbbbbbbbbbb.mp4") }]));
  await r.insertReview(mk("gone", "hidden", "2026-10-22T00:00:00Z"));
  const pub = await r.publicReviews();
  assert.deepEqual(pub.reviews.map((x) => x.id), ["pin", "new", "old"]);
  assert.equal(pub.count, 3);
  assert.ok(!JSON.stringify(pub).includes("bbbbbbbbbbbbbbbb"), "pending media is never in public output");
  assert.ok(!JSON.stringify(pub).includes("dev1") && !JSON.stringify(pub).includes("ip1"), "no device/ip in public output");
  assert.equal(pub.reviews[1].media.length, 1);
  assert.equal(await r.countReviewsSince("dev1", "x", "2026-10-21T00:00:00Z"), 2, "rate limit counts this device");
  await r.deleteReview("wait");
  assert.equal(existsSync(r.mockMediaFile("pending/2026-10-21/bbbbbbbbbbbbbbbb.mp4")), false, "media deleted with the review");
  assert.equal(await r.getReview("wait"), null);
});

test("local media URLs: signed per path and direction, expire", async () => {
  const { mockUrl, checkMockUrl } = await load();
  const u = new URL(mockUrl("get", "pending/x.jpg", 60), "http://x");
  const [p, e, s] = ["p", "e", "s"].map((k) => u.searchParams.get(k)!);
  assert.equal(checkMockUrl("get", p, e, s), true);
  assert.equal(checkMockUrl("put", p, e, s), false, "a view link can't upload");
  assert.equal(checkMockUrl("get", "pending/other.jpg", e, s), false);
  assert.equal(checkMockUrl("get", p, String(Date.now() - 1), s), false);
});
