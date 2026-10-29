import { test } from "node:test";
import assert from "node:assert/strict";
import { fromRows, parseRange, rangeStart, totalStories } from "../dashboard";
import type { BookRecord, OrderRecord } from "../types";
import type { StoredEvent } from "../events";

const parent = { name: "Mona", whatsapp: "01012345678", governorate: "Cairo", city: "Maadi", street: "12 Road 9" };
const order = (id: string, extra: Partial<OrderRecord>): OrderRecord => ({ id, status: "ordered", edit_requested: false, child: { name: "Lulu", age: 6, gender: "girl" }, photos: {}, books: [], world: { favourites: [] }, words: {}, activities: [], parent, list_price: 249, discount: 100, delivery: 89, total: 238, created_at: "2026-10-29T10:00:00Z", updated_at: "", ...extra } as OrderRecord);
const book = (id: string, created_at: string) => ({ id, slug: "anger", gender: "girl", form: { age: 5 }, created_at } as unknown as BookRecord);
const ev = (event: string, session_id: string, created_at: string, extra: Partial<StoredEvent> = {}) => ({ event, session_id, created_at, ...extra } as StoredEvent);

test("range: All time is the default and has no start", () => {
  assert.equal(parseRange(undefined), "all");
  assert.equal(parseRange("bogus"), "all");
  assert.equal(rangeStart("all"), null);
  assert.ok(rangeStart("7d")! < new Date().toISOString());
});

test("totals: books ordered = sum of quantity (old orders = 3), cancelled excluded, TOTAL STORIES = free + ordered", () => {
  const orders = [order("a", { quantity: 2, total: 387 }), order("b", { total: 538, list_price: 749, discount: 300 }), order("c", { quantity: 5, status: "cancelled", total: 834 })];
  const books = [book("x", "2026-08-01T10:00:00Z"), book("y", "2026-10-29T09:00:00Z")];
  const events = [
    ev("page_view", "d1", "2026-10-28T10:00:00Z"), ev("page_view", "d1", "2026-10-28T11:00:00Z"), ev("page_view", "d1", "2026-10-29T10:00:00Z"),
    ev("story_started", "d2", "2026-10-29T10:00:00Z"), ev("story_started", "d2", "2026-10-29T10:05:00Z"),
  ];
  const s = fromRows(null, events, books, orders, 2, 2);
  assert.equal(s.sessions, 3, "d1 on two Cairo days + d2 = 3 visits");
  assert.equal(s.unique_devices, 2);
  assert.equal(s.builder_starts, 2);
  assert.deepEqual([s.free_stories, s.orders, s.books_ordered, s.revenue], [2, 2, 5, 925]);
  assert.equal(totalStories(s), 7);
  assert.equal(s.first_record, "2026-08-01T10:00:00Z");
  assert.equal(s.first_events.story_started, "2026-10-29T10:00:00Z");
  const recent = fromRows("2026-10-29T00:00:00Z", events, books, orders, 2, 0);
  assert.deepEqual([recent.free_stories, recent.sessions], [1, 2]);
});
