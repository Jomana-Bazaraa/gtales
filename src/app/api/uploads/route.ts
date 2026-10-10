import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { putPrivatePhoto } from "@/lib/db";

export const maxDuration = 30;
const MAX = 10 * 1024 * 1024;

/** Photo upload for the Series order (SPEC §12.2): private bucket, returns a key only, never a public URL. */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "no_file" }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "too_big", message: "Up to 10 MB, please." }, { status: 413 });
  const type = file.type || "image/jpeg";
  if (!/^image\/(jpeg|png|heic|heif|webp)$/.test(type)) return NextResponse.json({ error: "type", message: "A JPG, PNG or HEIC photo, please." }, { status: 415 });
  const ext = type.split("/")[1].replace("jpeg", "jpg");
  const key = `${new Date().toISOString().slice(0, 10)}/${nanoid(16)}.${ext}`;
  await putPrivatePhoto(key, Buffer.from(await file.arrayBuffer()), type);
  return NextResponse.json({ key });
}
