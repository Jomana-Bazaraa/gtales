import type { BookLanguage, OrderRecord, OrderStatus } from "./types";

/** Status pipeline (SPEC §10). Parent-facing labels; the same words appear in My stories and WhatsApp. */
export const STATUS_ORDER: OrderStatus[] = ["ordered", "being_made", "awaiting_approval", "approved", "printing", "shipped", "delivered_paid"];
export const STATUS_LABEL: Record<OrderStatus, string> = {
  ordered: "Ordered", being_made: "Being made", awaiting_approval: "Your approval", approved: "Approved", printing: "Printing", shipped: "On its way", delivered_paid: "Delivered", cancelled: "Cancelled",
};
export const STATUS_NEXT: Record<OrderStatus, string> = {
  ordered: "Our team is starting on the pictures.", being_made: "Our team is creating the pictures and the three tales. Usually 5 days.",
  awaiting_approval: "Check every page on WhatsApp and tell us what to change, or approve.", approved: "Thank you! Printing starts now.",
  printing: "About 3 days.", shipped: "The courier will call you. Pay cash or card at the door.", delivered_paid: "Enjoy the books! Photos are deleted now.", cancelled: "This order was cancelled.",
};

/** Books in an order: saved quantity; orders from before 29 Oct (no quantity) were the three-book Series. */
export function orderQuantity(o: Pick<OrderRecord, "quantity" | "parent">): number {
  return o.quantity ?? o.parent.quantity ?? 3;
}
export const booksLabel = (n: number) => `${n} printed book${n === 1 ? "" : "s"}`;
/** The books line of an order's price: per-book orders (29 Oct on) "2 printed books × 249 EGP"; older orders had one Series price. */
export function booksLine(o: Pick<OrderRecord, "quantity" | "list_price" | "parent" | "discount" | "delivery" | "total">): { label: string; amount: number } {
  const q = orderQuantity(o);
  // before 29 Oct list_price was the whole Series: its total doesn't add up per book (749 × 3 − 300 + 89 ≠ 538)
  if (q * o.list_price - o.discount + o.delivery !== o.total) return { label: `${booksLabel(q)} (Series price)`, amount: o.list_price };
  return { label: `${booksLabel(q)} × ${o.list_price} EGP`, amount: q * o.list_price };
}

/** Book language choices (U6), in the order the form shows them. */
export const BOOK_LANGUAGES: { value: BookLanguage; label: string; short: string }[] = [
  { value: "en", label: "🇺🇸 English", short: "English" },
  { value: "eg", label: "🇪🇬 Egyptian Arabic (عامية)", short: "Egyptian Arabic (عامية)" },
  { value: "ar", label: "📜 Literary Arabic (فصحى)", short: "Literary Arabic (فصحى)" },
];
export function orderLanguage(o: Pick<OrderRecord, "language" | "parent">): BookLanguage {
  return o.language ?? o.parent.language ?? "en";
}
export const languageLabel = (l: BookLanguage) => BOOK_LANGUAGES.find((x) => x.value === l)?.short ?? l;
