import { NextResponse, after } from "next/server";
import { nanoid } from "nanoid";
import { getOrder, listBooks, saveMagicToken } from "@/lib/db";
import { sendMagicLinkEmail } from "@/lib/email";
import { logEvent } from "@/lib/events";
import { normalisePhone, sessionCookie } from "@/lib/session";
import { baseUrl } from "@/lib/site";

/**
 * Passwordless sign-in (SPEC §10).
 *  { email }                → magic link by email (silent if unknown)
 *  { order, whatsapp }      → session for that WhatsApp number when the order matches
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: string; order?: string; whatsapp?: string };
  if (body.email) {
    const email = body.email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "invalid" }, { status: 400 });
    const base = await baseUrl();
    after(async () => {
      const has = (await listBooks(2000)).some((b) => b.contact === email);
      if (!has) return; // never reveal whether an email exists
      const token = nanoid(32);
      await saveMagicToken(token, email);
      await sendMagicLinkEmail(email, "en", `${base}/my-stories/${token}`);
      await logEvent({ event: "signin_code_sent", meta: { via: "email" } });
    });
    return NextResponse.json({ ok: true });
  }
  if (body.order && body.whatsapp) {
    const o = await getOrder(body.order.trim().toUpperCase());
    const phone = normalisePhone(body.whatsapp);
    if (!o || normalisePhone(o.parent.whatsapp) !== phone) return NextResponse.json({ error: "no_match", message: "We couldn't find that order with this number." }, { status: 404 });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(sessionCookie({ whatsapp: phone, at: Date.now() }));
    await logEvent({ event: "signin_success", meta: { via: "order" } });
    return res;
  }
  return NextResponse.json({ error: "invalid" }, { status: 400 });
}
