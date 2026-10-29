/**
 * Reviews wall (SPEC §5.6, §11, §12.6). Table `reviews` + PRIVATE bucket `reviews` (migration 0005).
 * Media never passes through the Worker: the browser uploads straight to Supabase with a one-time signed
 * upload URL, and pages show approved media through short-lived signed URLs. Pending media is never public.
 * Mock mode (no Supabase): the same flow on .data/ with HMAC-signed local URLs.
 */
import { createHash, createHmac, timingSafeEqual } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { isMockDb, supabase } from "./db";

export type ReviewStatus = "pending" | "approved" | "hidden";
export interface ReviewMedia { type: "image" | "video"; path: string }
export interface Review {
  id: string;
  created_at: string;
  updated_at: string;
  rating: number;
  text: string;
  first_name: string;
  city: string | null;
  child_age: number | null;
  story_slug: string | null;
  media: ReviewMedia[];
  consent_at: string;
  status: ReviewStatus;
  featured: boolean;
  source: "form" | "admin";
  approved_at: string | null;
  device_id?: string | null;
  ip_hash?: string | null;
}
/** What a public page gets: no device/ip, media as signed URLs. */
export interface PublicReview extends Omit<Review, "media" | "device_id" | "ip_hash"> { media: { type: "image" | "video"; url: string }[] }

export const BUCKET = "reviews";
export const LIMITS = { photos: 3, videos: 1, videoBytes: 50 * 1024 * 1024, videoSeconds: 30, photoBytes: 8 * 1024 * 1024, perDevicePerDay: 10, text: 5000 } as const;
export const MEDIA_TYPES: Record<string, { type: "image" | "video"; ext: string }> = {
  "image/jpeg": { type: "image", ext: "jpg" }, "image/png": { type: "image", ext: "png" }, "image/webp": { type: "image", ext: "webp" },
  "video/mp4": { type: "video", ext: "mp4" }, "video/quicktime": { type: "video", ext: "mov" },
};
const SIGNED_URL_SECONDS = 2 * 3600;

// ---------- signing (tickets, mock media URLs) ----------
const secret = () => process.env.INTERNAL_RENDER_TOKEN || process.env.ADMIN_PASSWORD || "gtales-dev";
const sign = (s: string) => createHmac("sha256", secret()).update(s).digest("base64url");
const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
export const hashIp = (ip: string) => createHash("sha256").update(`${secret()}:${ip}`).digest("hex").slice(0, 32);

/** A ticket proves Turnstile passed for this device in the last 30 minutes; needed for upload URLs and the final submit. */
export function issueTicket(deviceId: string): string {
  const exp = Date.now() + 30 * 60_000;
  return `${exp}.${sign(`ticket:${deviceId}:${exp}`)}`;
}
export function checkTicket(ticket: string | undefined, deviceId: string): boolean {
  const [exp, sig] = (ticket ?? "").split(".");
  return !!sig && Number(exp) > Date.now() && same(sig, sign(`ticket:${deviceId}:${exp}`));
}

/** Cloudflare Turnstile. Without TURNSTILE_SECRET_KEY (local dev) it passes with a warning. */
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const key = process.env.TURNSTILE_SECRET_KEY;
  // Both keys or no check: a secret without the (build-time) site key would block every review with no widget to tick.
  if (!key || !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) { console.warn("[reviews] Turnstile keys not both set: skipping the bot check"); return true; }
  if (!token) return false;
  const body = new URLSearchParams({ secret: key, response: token, remoteip: ip });
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body }).then((x) => x.json()).catch(() => null);
  return !!r?.success;
}

// ---------- mock store ----------
const DIR = path.join(process.cwd(), ".data");
const MEDIA_DIR = path.join(DIR, "reviews-media");
async function mockAll(): Promise<Review[]> { return JSON.parse(await fs.readFile(path.join(DIR, "reviews.json"), "utf8").catch(() => "[]")); }
async function mockSave(all: Review[]) { await fs.mkdir(DIR, { recursive: true }); await fs.writeFile(path.join(DIR, "reviews.json"), JSON.stringify(all, null, 2)); }
const safeKey = (p: string) => path.normalize(p).replace(/^(\.\.[/\\])+/, "");
export const mockMediaFile = (p: string) => path.join(MEDIA_DIR, safeKey(p));
export function mockUrl(kind: "get" | "put", p: string, seconds: number): string {
  const exp = Date.now() + seconds * 1000;
  return `/api/reviews/media?p=${encodeURIComponent(p)}&e=${exp}&s=${sign(`${kind}:${p}:${exp}`)}`;
}
export function checkMockUrl(kind: "get" | "put", p: string, exp: string, sig: string): boolean {
  return Number(exp) > Date.now() && !!sig && same(sig, sign(`${kind}:${p}:${exp}`));
}

// ---------- media ----------
/** A one-time URL the browser PUTs the file to (Content-Type header = the file type). */
export async function createUploadUrl(contentType: string, prefix: "pending" | "admin"): Promise<{ url: string; path: string }> {
  const t = MEDIA_TYPES[contentType];
  if (!t) throw new Error("type");
  const p = `${prefix}/${new Date().toISOString().slice(0, 10)}/${nanoid(16)}.${t.ext}`;
  if (isMockDb) return { url: mockUrl("put", p, 30 * 60), path: p };
  const { data, error } = await supabase().storage.from(BUCKET).createSignedUploadUrl(p);
  if (error || !data) throw new Error(error ? errText(error) : "upload url");
  return { url: data.signedUrl, path: p };
}
/** The file exists, is a photo/video of the claimed type and within the size limit. */
export async function checkUploaded(m: ReviewMedia): Promise<boolean> {
  const max = m.type === "video" ? LIMITS.videoBytes : LIMITS.photoBytes;
  if (isMockDb) {
    const st = await fs.stat(mockMediaFile(m.path)).catch(() => null);
    return !!st && st.size > 0 && st.size <= max;
  }
  const { data, error } = await supabase().storage.from(BUCKET).info(m.path);
  let size = Number((data as { size?: number } | null)?.size ?? 0);
  let type = String((data as { contentType?: string } | null)?.contentType ?? "");
  if (error || !size) {
    // Fallback for Storage versions without /object/info: read the folder listing
    const dir = m.path.slice(0, m.path.lastIndexOf("/")), name = m.path.slice(m.path.lastIndexOf("/") + 1);
    const { data: list } = await supabase().storage.from(BUCKET).list(dir, { search: name, limit: 5 });
    const f = list?.find((x) => x.name === name) as { metadata?: { size?: number; mimetype?: string } } | undefined;
    size = Number(f?.metadata?.size ?? 0);
    type = String(f?.metadata?.mimetype ?? "");
  }
  return size > 0 && size <= max && MEDIA_TYPES[type]?.type === m.type;
}
/** Short-lived URLs for media, in order (null for a file that is gone). */
export async function signMedia(paths: string[], seconds = SIGNED_URL_SECONDS): Promise<(string | null)[]> {
  if (!paths.length) return [];
  if (isMockDb) return paths.map((p) => mockUrl("get", p, seconds));
  const { data } = await supabase().storage.from(BUCKET).createSignedUrls(paths, seconds);
  return paths.map((p) => data?.find((d) => d.path === p)?.signedUrl ?? null);
}
async function removeMedia(paths: string[]) {
  if (!paths.length) return;
  if (isMockDb) { for (const p of paths) await fs.rm(mockMediaFile(p), { force: true }); return; }
  await supabase().storage.from(BUCKET).remove(paths);
}

// ---------- reviews ----------
export async function insertReview(r: Review): Promise<void> {
  if (isMockDb) return mockSave([r, ...(await mockAll())]);
  const { error, status, statusText } = await supabase().from("reviews").insert(r);
  if (error) throw new Error(`HTTP ${status} ${statusText} · ${errText(error)}`);
}
export async function getReview(id: string): Promise<Review | null> {
  if (isMockDb) return (await mockAll()).find((r) => r.id === id) ?? null;
  const { data } = await supabase().from("reviews").select("*").eq("id", id).maybeSingle();
  return (data as Review) ?? null;
}
export async function updateReview(id: string, patch: Partial<Review>): Promise<void> {
  const p = { ...patch, updated_at: new Date().toISOString() };
  if (isMockDb) return mockSave((await mockAll()).map((r) => (r.id === id ? { ...r, ...p } : r)));
  const { error } = await supabase().from("reviews").update(p).eq("id", id);
  if (error) throw error;
}
/** Deletes the review and its media files. */
export async function deleteReview(id: string): Promise<void> {
  const r = await getReview(id);
  if (!r) return;
  await removeMedia(r.media.map((m) => m.path));
  if (isMockDb) return mockSave((await mockAll()).filter((x) => x.id !== id));
  const { error } = await supabase().from("reviews").delete().eq("id", id);
  if (error) throw error;
}
export async function listReviews(status?: ReviewStatus, limit = 500): Promise<Review[]> {
  if (isMockDb) return (await mockAll()).filter((r) => !status || r.status === status).sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, limit);
  let q = supabase().from("reviews").select("*").order("created_at", { ascending: false }).limit(limit);
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return (data as Review[]) ?? [];
}
export async function countReviewsSince(deviceId: string, ipHash: string, sinceIso: string): Promise<number> {
  if (isMockDb) return (await mockAll()).filter((r) => r.created_at >= sinceIso && r.source === "form" && (r.device_id === deviceId || r.ip_hash === ipHash)).length;
  const { count } = await supabase().from("reviews").select("id", { count: "exact", head: true }).eq("source", "form").gte("created_at", sinceIso).or(`device_id.eq.${deviceId},ip_hash.eq.${ipHash}`);
  return count ?? 0;
}
/** False when migration 0005 hasn't been run (no `reviews` table). */
export async function reviewsReady(): Promise<boolean> {
  if (isMockDb) return true;
  // not a head/count query: on a missing table supabase-js reports no error for those
  const { error, status } = await supabase().from("reviews").select("id").limit(1);
  return !error && status < 400;
}
export async function countPending(): Promise<number> {
  if (isMockDb) return (await mockAll()).filter((r) => r.status === "pending").length;
  const { count } = await supabase().from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending");
  return count ?? 0;
}

/** Approved reviews for public pages: featured first, then newest; media as short-lived signed URLs. Never pending or hidden. */
export async function publicReviews(limit = 200): Promise<{ reviews: PublicReview[]; count: number; average: number }> {
  const approved = (await listReviews("approved", 1000)).sort((a, b) => Number(b.featured) - Number(a.featured) || (a.created_at < b.created_at ? 1 : -1));
  const shown = approved.slice(0, limit);
  const urls = await signMedia(shown.flatMap((r) => r.media.map((m) => m.path)));
  let k = 0;
  const reviews = shown.map(({ device_id: _d, ip_hash: _i, ...r }) => {
    void _d; void _i;
    return { ...r, media: r.media.map((m) => ({ type: m.type, url: urls[k++] })).filter((m): m is { type: "image" | "video"; url: string } => !!m.url) };
  });
  const average = approved.length ? approved.reduce((a, r) => a + r.rating, 0) / approved.length : 0;
  return { reviews, count: approved.length, average };
}

/** Supabase errors are plain objects (they log as {}): the readable parts for the server log. */
export function errText(e: unknown): string {
  if (e instanceof Error && !("code" in e)) return e.message;
  const o = (e ?? {}) as { message?: string; code?: string; details?: string; hint?: string; statusCode?: string | number; error?: string };
  return [o.code ?? o.statusCode, o.message ?? o.error, o.details, o.hint].filter(Boolean).join(" · ") || JSON.stringify(e);
}

export function newReviewId(): string { return `rv_${nanoid(12)}`; }
