import { NextResponse } from "next/server";
import { getBook } from "@/lib/db";
import { logEvent } from "@/lib/events";
import { PDF_ENABLED, pdfState } from "@/lib/pdf-jobs";
import { cookies } from "next/headers";
import { isValidAdminCookie } from "@/lib/admin-auth";
import { baseUrl } from "@/lib/site";

/**
 * Story PDF (SPEC §8). Ready → redirect to the stored file. Not yet → the waiting page, which queues the
 * GitHub Action job and polls `?status=1` (JSON) until the file exists.
 */
export async function GET(req: Request, { params }: RouteContext<"/api/books/[id]/pdf">) {
  const { id } = await params;
  if (!PDF_ENABLED && !isValidAdminCookie((await cookies()).get("estoria_admin")?.value)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const book = await getBook(id);
  if (!book) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const state = await pdfState(id);
  if (new URL(req.url).searchParams.get("status")) {
    return NextResponse.json(state ? (state.status === "done" ? state : { status: state.status }) : { status: "none" }, { headers: { "cache-control": "no-store" } });
  }
  if (state?.status !== "done") return NextResponse.redirect(new URL(`/story/${id}/pdf`, await baseUrl()));
  await logEvent({ event: "pdf_downloaded", story_id: id, tale: book.slug, gender: book.gender, child_age: book.form.age, meta: { kind: "story" } });
  return NextResponse.redirect(new URL(state.url, await baseUrl()));
}
