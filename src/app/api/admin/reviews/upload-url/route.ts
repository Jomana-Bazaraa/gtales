import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isValidAdminCookie } from "@/lib/admin-auth";
import { createUploadUrl, MEDIA_TYPES } from "@/lib/reviews";

/** Signed upload URL for a review the admin adds by hand. */
export async function POST(req: Request) {
  const store = await cookies();
  if (!isValidAdminCookie(store.get("estoria_admin")?.value)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (!MEDIA_TYPES[b.content_type]) return NextResponse.json({ error: "type", message: "Photos (JPG, PNG) and videos (MP4, MOV) only." }, { status: 415 });
  return NextResponse.json(await createUploadUrl(b.content_type, "admin"));
}
