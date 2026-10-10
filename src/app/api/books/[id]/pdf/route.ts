import { NextResponse } from "next/server";
import { getBook, updateBook } from "@/lib/db";
import { renderBookPdf } from "@/lib/pdf";
import { logEvent } from "@/lib/events";
import { baseUrl } from "@/lib/site";

export const maxDuration = 60;

/** Lazily renders the A4 story PDF on first request, then redirects to the stored file (SPEC §8). */
export async function GET(_req: Request, { params }: RouteContext<"/api/books/[id]/pdf">) {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) return NextResponse.json({ error: "not_found" }, { status: 404 });
  let url = book.pdf_url;
  if (!url) {
    url = await renderBookPdf(id, await baseUrl());
    await updateBook(id, { pdf_url: url });
  }
  await logEvent({ event: "pdf_downloaded", story_id: id, tale: book.slug, meta: { kind: "story" } });
  return NextResponse.redirect(new URL(url, await baseUrl()));
}
