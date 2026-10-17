import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isValidAdminCookie } from "@/lib/admin-auth";
import { requestPdf } from "@/lib/pdf-jobs";
import { baseUrl } from "@/lib/site";

/** Admin "Generate PDF": queues the render job and starts the GitHub Action (LAUNCH-PLAN §1). */
export async function POST(req: Request) {
  const store = await cookies();
  if (!isValidAdminCookie(store.get("estoria_admin")?.value)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const form = await req.formData();
  const id = String(form.get("book_id") ?? "").slice(0, 40);
  const state = await requestPdf(id, "admin", form.get("force") === "1");
  if (!state) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.redirect(new URL("/admin", await baseUrl()), 303);
}
