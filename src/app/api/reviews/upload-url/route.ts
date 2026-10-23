import { NextResponse } from "next/server";
import { checkTicket, createUploadUrl, MEDIA_TYPES } from "@/lib/reviews";

/** Step 2: a one-time signed URL per photo/video; the browser uploads straight to the private bucket. */
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const device = typeof b.device_id === "string" ? b.device_id.replace(/[^a-z0-9-]/gi, "").slice(0, 60) : "";
  if (!checkTicket(b.ticket, device)) return NextResponse.json({ error: "ticket", message: "This page was open too long. Please send again." }, { status: 403 });
  if (!MEDIA_TYPES[b.content_type]) return NextResponse.json({ error: "type", message: "Photos (JPG, PNG) and videos (MP4, MOV) only." }, { status: 415 });
  return NextResponse.json(await createUploadUrl(b.content_type, "pending"));
}
