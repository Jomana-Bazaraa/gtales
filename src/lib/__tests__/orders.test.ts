import { test } from "node:test";
import assert from "node:assert/strict";
import { booksLabel, booksLine, orderQuantity } from "../orders";

const parent = { name: "Mona", whatsapp: "01012345678", governorate: "Cairo", city: "Maadi", street: "12 Road 9" };

test("quantity: saved value, or the fallback inside parent, or 3 for orders before 29 Oct", () => {
  assert.equal(orderQuantity({ quantity: 2, parent }), 2);
  assert.equal(orderQuantity({ parent: { ...parent, quantity: 5 } }), 5);
  assert.equal(orderQuantity({ parent }), 3, "old order = the three-book Series");
});
test("books line: per book from 29 Oct, the old Series price before", () => {
  assert.deepEqual(booksLine({ quantity: 2, list_price: 249, discount: 200, delivery: 89, total: 387, parent }), { label: "2 printed books × 249 EGP", amount: 498 });
  assert.deepEqual(booksLine({ quantity: 1, list_price: 249, discount: 0, delivery: 89, total: 338, parent }), { label: "1 printed book × 249 EGP", amount: 249 });
  assert.deepEqual(booksLine({ list_price: 749, discount: 300, delivery: 89, total: 538, parent }), { label: "3 printed books (Series price)", amount: 749 });
  assert.deepEqual(booksLine({ quantity: 3, list_price: 749, discount: 300, delivery: 89, total: 538, parent }), { label: "3 printed books (Series price)", amount: 749 }, "old order after 0007 set it to 3");
  assert.equal(booksLabel(1), "1 printed book");
});
