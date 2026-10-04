import { readMockFile } from "@/lib/db";

const TYPES: Record<string, string> = { svg: "image/svg+xml", png: "image/png", jpg: "image/jpeg", pdf: "application/pdf" };

/** Serves files generated in mock mode (no Supabase). Not used in production. */
export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const k = key.join("/");
  const bytes = await readMockFile(k);
  if (!bytes) return new Response("not found", { status: 404 });
  const ext = k.split(".").pop() ?? "";
  return new Response(new Uint8Array(bytes), { headers: { "content-type": TYPES[ext] ?? "application/octet-stream", "cache-control": "public, max-age=31536000, immutable" } });
}
