/**
 * Two Gemini image calls per story: cover + line-art edit of the cover.
 * Reference art for each Keeper lives in public/keepers/<id>.png (optional but strongly recommended).
 * Mock mode writes an SVG placeholder.
 */
import { promises as fs } from "fs";
import path from "path";
import { genai, isMockAi } from "./ai";
import { KEEPERS, type KeeperId } from "./keepers";
import { HAIR_COLORS, HAIR_STYLES, SKIN_TONES } from "./i18n";
import type { Appearance, Gender } from "./types";
import { putFile } from "./db";

const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-lite-image";

export function appearanceToText(a: Appearance, gender: Gender, age: number): string {
  const skin = SKIN_TONES.find((s) => s.id === a.skinTone)?.en ?? a.skinTone;
  const hairStyle = HAIR_STYLES.find((s) => s.id === a.hairStyle)?.en ?? a.hairStyle;
  const hairColor = HAIR_COLORS.find((s) => s.id === a.hairColor)?.en ?? a.hairColor;
  const hair = hairStyle === "Hijab" ? `wearing a simple ${hairColor.toLowerCase()}-toned hijab` : `${hairStyle.toLowerCase()} ${hairColor.toLowerCase()} hair`;
  return `a ${age}-year-old ${gender} with ${skin.toLowerCase()} skin tone and ${hair}${a.details ? `, ${a.details}` : ""}`;
}

const STYLE =
  "Children's picture-book illustration, flat vector-like style with soft textured shading, warm palette (coral, cream, deep indigo accents), simple rounded shapes, friendly expressions, clean composition, no text, no letters, no watermark.";

async function keeperReference(id: KeeperId): Promise<{ mimeType: string; data: string } | null> {
  try {
    const p = path.join(process.cwd(), "public", "keepers", `${id}.png`);
    const b = await fs.readFile(p);
    return { mimeType: "image/png", data: b.toString("base64") };
  } catch {
    return null;
  }
}

async function extractImage(res: { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> } }> }): Promise<{ bytes: Buffer; mime: string }> {
  const parts = res.candidates?.[0]?.content?.parts ?? [];
  for (const p of parts) {
    if (p.inlineData?.data) return { bytes: Buffer.from(p.inlineData.data, "base64"), mime: p.inlineData.mimeType || "image/png" };
  }
  throw new Error("Image model returned no image");
}

export async function generateCover(args: { storyId: string; keeper: KeeperId; scene: string; appearance: Appearance; gender: Gender; age: number }): Promise<{ url: string; bytes: Buffer; mime: string }> {
  const k = KEEPERS[args.keeper];
  if (isMockAi) {
    const svg = placeholderSvg(k.color, k.name.en, false);
    const bytes = Buffer.from(svg);
    const url = await putFile(`${args.storyId}/cover.svg`, bytes, "image/svg+xml");
    return { url, bytes, mime: "image/svg+xml" };
  }
  const ref = await keeperReference(args.keeper);
  const child = appearanceToText(args.appearance, args.gender, args.age);
  const prompt = `${STYLE}\n\nScene: ${args.scene}\n\nThe child: ${child}. The Keeper: ${k.visualBrief}${ref ? " Match the attached reference image of the Keeper exactly (same character design, colours and proportions)." : ""}\nLandscape 4:3 composition, both characters clearly visible, child on the left, Keeper on the right.`;
  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [{ text: prompt }];
  if (ref) parts.push({ inlineData: ref });
  const res = await genai().models.generateContent({
    model: IMAGE_MODEL,
    contents: [{ role: "user", parts }],
    config: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "4:3", imageSize: "1K" } },
  });
  const { bytes, mime } = await extractImage(res);
  const ext = mime.includes("jpeg") ? "jpg" : "png";
  const url = await putFile(`${args.storyId}/cover.${ext}`, bytes, mime);
  return { url, bytes, mime };
}

export async function generateLineArt(args: { storyId: string; keeper: KeeperId; cover: { bytes: Buffer; mime: string } }): Promise<string> {
  const k = KEEPERS[args.keeper];
  if (isMockAi) {
    const svg = placeholderSvg("#2a2320", k.name.en, true);
    return putFile(`${args.storyId}/lineart.svg`, Buffer.from(svg), "image/svg+xml");
  }
  const prompt =
    "Convert this illustration into a clean black-and-white colouring-book page: crisp black outlines only, pure white fill, no shading, no grey, no colour, no text. Keep every character and the composition exactly the same. Lines thick enough for a child to colour inside.";
  const res = await genai().models.generateContent({
    model: IMAGE_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { mimeType: args.cover.mime, data: args.cover.bytes.toString("base64") } }] }],
    config: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "4:3", imageSize: "1K" } },
  });
  const { bytes, mime } = await extractImage(res);
  const ext = mime.includes("jpeg") ? "jpg" : "png";
  return putFile(`${args.storyId}/lineart.${ext}`, bytes, mime);
}

function placeholderSvg(color: string, label: string, outline: boolean): string {
  const fill = outline ? "none" : color;
  const stroke = outline ? "#111" : "none";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="${outline ? "#fff" : "#fff8ef"}"/>
  <ellipse cx="400" cy="520" rx="320" ry="40" fill="${outline ? "none" : "#f6ead8"}" stroke="${stroke}" stroke-width="4"/>
  <!-- child -->
  <circle cx="260" cy="250" r="70" fill="${outline ? "none" : "#e9bf9a"}" stroke="${stroke}" stroke-width="5"/>
  <rect x="200" y="320" width="120" height="170" rx="40" fill="${outline ? "none" : "#2b2d6b"}" stroke="${stroke}" stroke-width="5"/>
  <circle cx="240" cy="240" r="7" fill="#111"/><circle cx="280" cy="240" r="7" fill="#111"/>
  <path d="M235 280 Q260 300 285 280" stroke="#111" stroke-width="5" fill="none" stroke-linecap="round"/>
  <!-- keeper -->
  <path d="M540 470 C 470 420, 480 300, 540 240 C 560 300, 600 290, 600 240 C 650 300, 640 440, 540 470 Z" fill="${fill}" stroke="${stroke}" stroke-width="5" ${outline ? "" : 'opacity="0.95"'}/>
  <circle cx="525" cy="370" r="9" fill="#111"/><circle cx="565" cy="370" r="9" fill="#111"/>
  <path d="M525 405 Q545 420 565 405" stroke="#111" stroke-width="5" fill="none" stroke-linecap="round"/>
  <text x="400" y="575" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#6b5f58">${label} — placeholder (mock mode)</text>
</svg>`;
}
