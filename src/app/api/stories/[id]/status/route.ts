import { NextResponse } from "next/server";
import { getStory } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getStory(id);
  if (!s) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(
    { status: s.status, progress: s.progress, pdf_color_url: s.pdf_color_url, pdf_lineart_url: s.pdf_lineart_url, error: s.status === "failed" ? s.error : null },
    { headers: { "cache-control": "no-store" } },
  );
}
