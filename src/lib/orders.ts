import type { OrderStatus } from "./types";

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
