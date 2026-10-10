import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isValidAdminCookie } from "@/lib/admin-auth";
import { readPrivatePhoto } from "@/lib/db";

/** Mock-mode photo read for admin only (Supabase mode uses signed URLs). */
export async function GET(_req: Request, { params }: RouteContext<"/api/admin/photos/[...key]">) {
  const store = await cookies();
  if (!isValidAdminCookie(store.get("estoria_admin")?.value)) return new NextResponse("forbidden", { status: 403 });
  const { key } = await params;
  const buf = await readPrivatePhoto(key.join("/"));
  if (!buf) return new NextResponse("not found", { status: 404 });
  return new NextResponse(new Uint8Array(buf), { headers: { "content-type": "image/jpeg", "cache-control": "private, max-age=600" } });
}
