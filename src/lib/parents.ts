/** Parents = users (LAUNCH-PLAN §1b). The id is a hash, so events and books can point at a parent without holding the contact. */
import { createHash } from "crypto";
import { upsertParent } from "./db";

export function normaliseContact(contact: string): string {
  const c = contact.trim().toLowerCase();
  if (c.includes("@")) return c;
  const digits = c.replace(/[^0-9]/g, "");
  return digits.startsWith("0") && digits.length === 11 ? `20${digits.slice(1)}` : digits; // Egyptian 01xxxxxxxxx → 201xxxxxxxxx
}
export function parentId(contact: string): string {
  return "p_" + createHash("sha256").update(normaliseContact(contact)).digest("hex").slice(0, 20);
}

/** Never throws: tracking must not break a story or an order. */
export async function rememberParent(contact: string, p: { name?: string; source?: string; first_book_id?: string; first_order_id?: string }): Promise<string> {
  const id = parentId(contact);
  const n = normaliseContact(contact);
  try {
    await upsertParent({ id, ...(n.includes("@") ? { email: n } : { whatsapp: n }), ...p });
  } catch (e) {
    console.error("[parents]", e);
  }
  return id;
}
