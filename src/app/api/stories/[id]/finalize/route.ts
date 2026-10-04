import { NextResponse, after } from "next/server";
import { runPdfsAndEmail } from "@/lib/pipeline";
import { baseUrl } from "@/lib/site";

export const maxDuration = 60;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = req.headers.get("x-internal-token");
  if (token !== (process.env.INTERNAL_RENDER_TOKEN || "dev")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await params;
  const base = await baseUrl();
  after(() => runPdfsAndEmail(id, base));
  return NextResponse.json({ ok: true });
}
