import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isValidAdminCookie } from "@/lib/admin-auth";
import { createUploadUrl, errText, MEDIA_TYPES } from "@/lib/reviews";

/** Signed upload URL for a review the admin adds by hand. */
export async function POST(req: Request) {
  const store = await cookies();
  if (!isValidAdminCookie(store.get("estoria_admin")?.value)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (!MEDIA_TYPES[b.content_type]) return NextResponse.json({ error: "type", message: "Photos (JPG, PNG) and videos (MP4, MOV) only." }, { status: 415 });
  try {
    return NextResponse.json(await createUploadUrl(b.content_type, "admin"));
  } catch (e) {
    console.error("[reviews] admin upload url failed:", errText(e));
    return NextResponse.json({ error: "unavailable", message: `Storage error: ${errText(e)}. Is migration 0005 (the reviews bucket) run in Supabase?` }, { status: 503 });
  }
}
