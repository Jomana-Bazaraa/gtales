import { NextResponse } from "next/server";
import { countReviewsSince, hashIp, issueTicket, LIMITS, verifyTurnstile } from "@/lib/reviews";

/** Step 1 of sending a review: Turnstile + the 10-a-day limit → a 30-minute ticket for uploads and the submit. */
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const device = typeof b.device_id === "string" ? b.device_id.replace(/[^a-z0-9-]/gi, "").slice(0, 60) : "";
  if (!device) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if ((await countReviewsSince(device, hashIp(ip), new Date(Date.now() - 86_400_000).toISOString())) >= LIMITS.perDevicePerDay)
    return NextResponse.json({ error: "rate_limited", message: "You've sent a lot of reviews today. Please try again tomorrow." }, { status: 429 });
  if (!(await verifyTurnstile(b.turnstile, ip))) return NextResponse.json({ error: "bot", message: "Please tick the check box above and try again." }, { status: 403 });
  return NextResponse.json({ ticket: issueTicket(device) });
}
