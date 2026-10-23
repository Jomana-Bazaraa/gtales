import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isValidAdminCookie } from "@/lib/admin-auth";
import { sendTestEmail } from "@/lib/email";

/** Admin → Settings → "Send test email": returns Resend's raw response. */
export async function POST(req: Request) {
  const store = await cookies();
  if (!isValidAdminCookie(store.get("estoria_admin")?.value)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const to = String(b.to || process.env.ADMIN_NOTIFY_EMAIL || "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return NextResponse.json({ error: "Write an email address to send the test to." }, { status: 400 });
  try {
    return NextResponse.json(await sendTestEmail(to));
  } catch (e) {
    return NextResponse.json({ sent: false, thrown: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
