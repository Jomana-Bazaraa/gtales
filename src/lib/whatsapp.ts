/**
 * WhatsApp messages per order status (SPEC §10). Sent manually by the team for now:
 * admin shows a wa.me link with the text pre-filled (open decision #4: Business API later).
 */
import type { OrderRecord } from "./types";
import { COPY } from "./gtales";
import { booksLabel, orderQuantity } from "./orders";

export function waLink(phone: string, text: string): string {
  const d = phone.replace(/\D/g, "");
  const intl = d.startsWith("0") ? "20" + d.slice(1) : d;
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
}

export function statusMessage(o: OrderRecord, base: string): string {
  const n = o.child.name, p = o.parent.name.split(" ")[0];
  const track = `${base}/my-stories?order=${o.id}`;
  switch (o.status) {
    case "ordered": return `Hi ${p}, this is GTales. We've got ${n}'s order (${o.id}): ${booksLabel(orderQuantity(o))}, ${o.total ? `${o.total} EGP on delivery` : "free, nothing to pay"}. Our team starts on the pictures now; about 5 days. Track it here: ${track}`;
    case "being_made": return `Hi ${p}, ${n}'s books are being made. We'll send you every page here for your approval in a few days. ${track}`;
    case "awaiting_approval": return `Hi ${p}, ${n}'s pages are ready for you to check. Please look at every page and tell us anything to change, or reply "Approved" and we start printing. ${track}`;
    case "approved": return `Thank you ${p}! ${n}'s books are approved and go to print now. Delivery in about 5 days. ${track}`;
    case "printing": return `Hi ${p}, ${n}'s ${booksLabel(orderQuantity(o)).replace(" printed", "")} ${orderQuantity(o) === 1 ? "is" : "are"} printing. The courier will call you before delivery. ${o.total ? `${o.total} EGP cash or card at the door.` : "Nothing to pay."} ${track}`;
    case "shipped": return `Hi ${p}, ${n}'s books are on their way to ${o.parent.city}. The courier will call ${o.parent.whatsapp}. ${o.total ? `${o.total} EGP on delivery.` : "Nothing to pay."}`;
    case "delivered_paid": return `Hi ${p}, we hope ${n} loves the books! ${n}'s photos are now deleted from our system. If you have a minute, tell us how it went: did the story help? Reply here, or add a review (photos welcome): ${base}/reviews/new ${COPY.slogan}`;
    case "cancelled": return `Hi ${p}, ${n}'s order ${o.id} has been cancelled and the photos deleted. If this is a mistake, reply here.`;
  }
}
