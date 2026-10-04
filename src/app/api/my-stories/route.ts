import { NextResponse, after } from "next/server";
import { nanoid } from "nanoid";
import { saveMagicToken, storiesByEmail } from "@/lib/db";
import { sendMagicLinkEmail } from "@/lib/email";
import { baseUrl } from "@/lib/site";

export async function POST(req: Request) {
  const { email, lang } = (await req.json().catch(() => ({}))) as { email?: string; lang?: "en" | "ar" };
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const base = await baseUrl();
  after(async () => {
    const stories = await storiesByEmail(email);
    if (!stories.length) return; // silent: don't reveal whether an email exists
    const token = nanoid(32);
    await saveMagicToken(token, email.toLowerCase());
    await sendMagicLinkEmail(email, lang === "ar" ? "ar" : "en", `${base}/my-stories/${token}`);
  });
  return NextResponse.json({ ok: true });
}
