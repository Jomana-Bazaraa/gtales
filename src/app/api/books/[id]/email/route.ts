import { NextResponse, after } from "next/server";
import { getBook, updateBook } from "@/lib/db";
import { sendBookEmail } from "@/lib/email";
import { logEvent } from "@/lib/events";
import { rememberParent } from "@/lib/parents";
import { baseUrl } from "@/lib/site";

/** "Email me this story" on the story page (the fast form asks no email). Saves it as the book's contact. */
export async function POST(req: Request, { params }: RouteContext<"/api/books/[id]/email">) {
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const email = String(b.email ?? "").trim().toLowerCase().slice(0, 120);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "invalid", message: "Please write an email address." }, { status: 400 });
  const book = await getBook(id);
  if (!book) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const hadEmail = (book.contact ?? "").includes("@");
  if (hadEmail && book.contact !== email) return NextResponse.json({ error: "taken", message: "This story was already sent to another address." }, { status: 409 });
  const parent_id = await rememberParent(email, { first_book_id: id, source: book.ref });
  if (!hadEmail) await updateBook(id, book.contact ? { parent_id } : { contact: email, parent_id }); // a WhatsApp contact is kept
  await logEvent({ event: "story_emailed", story_id: id, tale: book.slug, parent_id });
  const site = await baseUrl();
  after(() => sendBookEmail({ ...book, contact: email }, site).catch((e) => console.error("[email] book", e)));
  return NextResponse.json({ ok: true });
}
