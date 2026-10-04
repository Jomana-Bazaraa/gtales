import { NextResponse, after } from "next/server";
import { nanoid } from "nanoid";
import { storyInputSchema } from "@/lib/validation";
import { countRecentByEmailOrIp, insertStory } from "@/lib/db";
import { runPdfsAndEmail, runTextAndImages } from "@/lib/pipeline";
import { baseUrl } from "@/lib/site";
import type { StoryInput, StoryRecord } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = storyInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid", issues: parsed.error.issues }, { status: 400 });
  const input = parsed.data as StoryInput;
  if (input.website) return NextResponse.json({ id: nanoid(12) }); // honeypot: pretend success

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const recent = await countRecentByEmailOrIp(input.parentEmail.toLowerCase(), ip, 60);
  const limit = Number(process.env.RATE_LIMIT_PER_HOUR || 5);
  if (recent >= limit) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const id = nanoid(14);
  const now = new Date().toISOString();
  const rec: StoryRecord & { ip?: string } = {
    id,
    status: "pending",
    progress: "template",
    input: { ...input, parentEmail: input.parentEmail.toLowerCase() },
    keeper_id: null,
    generated: null,
    assembled: null,
    cover_url: null,
    lineart_url: null,
    pdf_color_url: null,
    pdf_lineart_url: null,
    error: null,
    email_sent_at: null,
    created_at: now,
    updated_at: now,
    ip,
  };
  await insertStory(rec);
  const base = await baseUrl();

  after(async () => {
    try {
      await runTextAndImages(id);
      // PDFs + email in a separate invocation so each stays within the time budget
      await fetch(`${base}/api/stories/${id}/finalize`, { method: "POST", headers: { "x-internal-token": process.env.INTERNAL_RENDER_TOKEN || "dev" } }).catch(() => {});
    } catch (e) {
      console.error(e);
    }
  });

  void runPdfsAndEmail; // referenced by finalize route
  return NextResponse.json({ id });
}
