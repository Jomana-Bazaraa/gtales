import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { isMockDb } from "@/lib/db";
import { checkMockUrl, LIMITS, mockMediaFile, MEDIA_TYPES } from "@/lib/reviews";

// Local development only (mock store): stands in for Supabase signed URLs. In production media is served by Supabase.
const params = (req: Request) => { const q = new URL(req.url).searchParams; return { p: q.get("p") ?? "", e: q.get("e") ?? "", s: q.get("s") ?? "" }; };

export async function GET(req: Request) {
  const { p, e, s } = params(req);
  if (!isMockDb || !checkMockUrl("get", p, e, s)) return new NextResponse(null, { status: 404 });
  const body = await fs.readFile(mockMediaFile(p)).catch(() => null);
  if (!body) return new NextResponse(null, { status: 404 });
  const type = Object.entries(MEDIA_TYPES).find(([, t]) => p.endsWith(`.${t.ext}`))?.[0] ?? "application/octet-stream";
  return new NextResponse(new Uint8Array(body), { headers: { "content-type": type, "cache-control": "private, max-age=3600" } });
}

export async function PUT(req: Request) {
  const { p, e, s } = params(req);
  if (!isMockDb || !checkMockUrl("put", p, e, s)) return new NextResponse(null, { status: 403 });
  const type = req.headers.get("content-type") ?? "";
  if (!MEDIA_TYPES[type]) return new NextResponse(null, { status: 415 });
  const body = Buffer.from(await req.arrayBuffer());
  if (body.length > LIMITS.videoBytes) return new NextResponse(null, { status: 413 });
  await fs.mkdir(path.dirname(mockMediaFile(p)), { recursive: true });
  await fs.writeFile(mockMediaFile(p), body);
  return NextResponse.json({ Key: p });
}
