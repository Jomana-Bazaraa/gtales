"use client";
/**
 * Review form (SPEC §5.6). mode "public": /reviews/new, Turnstile + the two consent boxes.
 * mode "admin": /admin/reviews/new, the admin confirms the parent agreed. Media goes straight to the
 * private bucket with one-time signed URLs; photos are shrunk to 1600 px in the browser first.
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CONSENT_DISPLAY, CONSENT_REMOVAL } from "@/lib/review-schema";
import { sessionId, track } from "@/lib/track";

type Item = { kind: "image" | "video"; blob: Blob; type: string; preview: string };
const MAX_PHOTOS = 3, MAX_VIDEO_BYTES = 50 * 1024 * 1024, MAX_VIDEO_SECONDS = 30, MAX_SIDE = 1600;
const VIDEO_TYPES = ["video/mp4", "video/quicktime"];
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

declare global {
  interface Window { turnstile?: { render: (el: HTMLElement, o: Record<string, unknown>) => string; reset: (id?: string) => void } }
}

export function ReviewForm({ mode, tale }: { mode: "public" | "admin"; tale?: string }) {
  const router = useRouter();
  const admin = mode === "admin";
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [firstName, setFirstName] = useState("");
  const [city, setCity] = useState("");
  const [age, setAge] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [status, setStatus] = useState<"approved" | "pending">("approved");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const turnstile = useRef<{ el: HTMLDivElement | null; id?: string; token?: string }>({ el: null });

  useEffect(() => { if (!admin) track("review_started", { meta: tale ? { tale } : undefined }); }, [admin, tale]);

  // Cloudflare Turnstile (public only; skipped when no site key is configured, e.g. local dev)
  useEffect(() => {
    if (admin || !SITE_KEY) return;
    const render = () => { if (turnstile.current.el && window.turnstile && !turnstile.current.id) turnstile.current.id = window.turnstile.render(turnstile.current.el, { sitekey: SITE_KEY, callback: (t: string) => { turnstile.current.token = t; }, "expired-callback": () => { turnstile.current.token = undefined; } }); };
    if (window.turnstile) return render();
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"; s.async = true; s.onload = render;
    document.head.appendChild(s);
  }, [admin]);
  useEffect(() => () => items.forEach((i) => URL.revokeObjectURL(i.preview)), [items]);

  const photos = items.filter((i) => i.kind === "image"), video = items.find((i) => i.kind === "video");

  const addPhotos = async (files: FileList | null) => {
    setErr(null);
    for (const f of Array.from(files ?? []).slice(0, MAX_PHOTOS - photos.length)) {
      try {
        const blob = await shrink(f);
        setItems((xs) => [...xs, { kind: "image", blob, type: "image/jpeg", preview: URL.createObjectURL(blob) }]);
      } catch { setErr("That photo couldn't be opened. Please choose a JPG or PNG photo."); }
    }
  };
  const addVideo = async (files: FileList | null) => {
    setErr(null);
    const f = files?.[0]; if (!f) return;
    const type = f.type || (/\.mov$/i.test(f.name) ? "video/quicktime" : /\.mp4$/i.test(f.name) ? "video/mp4" : "");
    if (!VIDEO_TYPES.includes(type)) return setErr("Videos in MP4 or MOV only, please.");
    if (f.size > MAX_VIDEO_BYTES) return setErr("That video is over 50 MB. Please choose a shorter one (30 seconds at most).");
    const secs = await duration(f);
    if (secs > MAX_VIDEO_SECONDS + 0.5) return setErr(`That video is ${Math.round(secs)} seconds. Please keep it to 30 seconds.`);
    setItems((xs) => [...xs.filter((x) => x.kind !== "video"), { kind: "video", blob: f, type, preview: URL.createObjectURL(f) }]);
  };

  const submit = async () => {
    setErr(null);
    if (!rating) return setErr("Please choose 1 to 5 stars.");
    if (!text.trim()) return setErr("Please write a few words.");
    if (!firstName.trim()) return setErr("Please write your first name.");
    if (admin ? !consent1 : !(consent1 && consent2)) return setErr(admin ? "Tick the box to confirm the parent agreed." : "Please tick both boxes.");
    const device = sessionId() ?? "nodevice-" + Math.random().toString(36).slice(2, 10);
    try {
      let ticket = "";
      if (!admin) {
        setBusy("Checking…");
        const t = await post("/api/reviews/ticket", { device_id: device, turnstile: turnstile.current.token });
        ticket = t.ticket;
      }
      const media: { type: "image" | "video"; path: string }[] = [];
      for (const it of items) {
        const label = it.kind === "video" ? "Uploading the video" : `Uploading photo ${photos.indexOf(it) + 1} of ${photos.length}`;
        setBusy(`${label}…`);
        const u = await post(admin ? "/api/admin/reviews/upload-url" : "/api/reviews/upload-url", { device_id: device, ticket, content_type: it.type });
        await put(u.url, it, (p) => setBusy(`${label}… ${p}%`));
        media.push({ type: it.kind, path: u.path });
      }
      setBusy("Sending…");
      const fields = { rating, text: text.trim(), first_name: firstName.trim(), city: city.trim() || undefined, child_age: age ? Number(age) : undefined, story_slug: tale, media };
      if (admin) {
        await post("/api/admin/reviews", { ...fields, consent_confirmed: consent1, status });
        router.push("/admin/reviews?status=" + status);
        return;
      }
      await post("/api/reviews", { ...fields, device_id: device, ticket, consent_display: consent1, consent_removal: consent2, website: (document.getElementById("rv-website") as HTMLInputElement | null)?.value || "" });
      setDone(true);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      if (window.turnstile && turnstile.current.id) { window.turnstile.reset(turnstile.current.id); turnstile.current.token = undefined; }
    } finally {
      setBusy(null);
    }
  };

  if (done) return (
    <div className="flex flex-col gap-4 items-center text-center py-10">
      <p className="m-0 text-[22px] leading-8 font-bold text-balance">Thank you! 💛 Your review will appear after we check it (usually within 24 hours).</p>
      <div className="flex gap-2 flex-wrap justify-center"><Link href="/reviews" className="btn-secondary">See what families say</Link><Link href="/tales" className="btn-ghost">Try another free story</Link></div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2 border-0 p-0 m-0">
        <legend className="font-bold text-[15px] mb-1">How many stars? *</legend>
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)}
              className={`w-12 h-12 text-[34px] leading-none grid place-items-center rounded-xl ${n <= rating ? "text-[#f5a623]" : "text-line"}`}>★</button>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1.5">
        <span className="font-bold text-[15px]">{admin ? "The review *" : "Your review *"}</span>
        <textarea className="field text-[16px] min-h-36" value={text} onChange={(e) => setText(e.target.value)} maxLength={5000} placeholder="What did your child love? Did the story help at home?" />
        <span className="text-xs text-ink-soft self-end">{text.length.toLocaleString()} / 5,000</span>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5 col-span-2 sm:col-span-1"><span className="font-bold text-[15px]">{admin ? "Parent's first name *" : "Your first name *"}</span>
          <input className="field" value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={30} autoComplete="given-name" placeholder="e.g. Mona" /></label>
        <label className="flex flex-col gap-1.5"><span className="font-bold text-[15px]">City</span>
          <input className="field" value={city} onChange={(e) => setCity(e.target.value)} maxLength={40} placeholder="e.g. Maadi" /></label>
        <label className="flex flex-col gap-1.5"><span className="font-bold text-[15px]">Child&apos;s age</span>
          <select className="field" value={age} onChange={(e) => setAge(e.target.value)}><option value="">—</option>{Array.from({ length: 14 }, (_, k) => k + 1).map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
      </div>
      <p className="m-0 -mt-3 text-xs text-ink-soft">We only show your first name, city and your child&apos;s age. Please don&apos;t write your child&apos;s full name.</p>

      <div className="flex flex-col gap-2">
        <span className="font-bold text-[15px]">Photos and a video (optional)</span>
        <div className="flex flex-wrap gap-2">
          {items.map((it, k) => (
            <div key={it.preview} className="relative w-24 h-24 rounded-xl overflow-hidden bg-surface-tint">
              {it.kind === "image"
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={it.preview} alt="" className="w-full h-full object-cover" />
                : <video src={it.preview} muted playsInline className="w-full h-full object-cover" />}
              <button type="button" aria-label="Remove" onClick={() => setItems((xs) => xs.filter((_, j) => j !== k))} className="absolute top-1 right-1 w-7 h-7 rounded-full bg-white/90 text-ink font-bold">×</button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {/* no `capture` attribute: phones offer both the camera and the gallery */}
          {photos.length < MAX_PHOTOS && <label className="btn-ghost cursor-pointer">📷 Add photos ({photos.length}/{MAX_PHOTOS})<input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} /></label>}
          {!video && <label className="btn-ghost cursor-pointer">🎥 Add a video<input type="file" accept="video/mp4,video/quicktime,video/*" className="sr-only" onChange={(e) => { addVideo(e.target.files); e.target.value = ""; }} /></label>}
        </div>
        <span className="text-xs text-ink-soft">Up to 3 photos and 1 video (30 seconds, 50 MB at most, MP4 or MOV).</span>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-surface-tint p-4">
        {admin ? (<>
          <label className="flex gap-3 items-start text-[15px]"><input type="checkbox" className="mt-1 w-5 h-5 shrink-0" checked={consent1} onChange={(e) => setConsent1(e.target.checked)} />
            <span>The parent agreed to both: &ldquo;{CONSENT_DISPLAY}&rdquo; and &ldquo;{CONSENT_REMOVAL}&rdquo; *</span></label>
          <label className="flex gap-3 items-center text-[15px]"><span className="font-bold">Publish</span>
            <select className="field !w-auto" value={status} onChange={(e) => setStatus(e.target.value as "approved" | "pending")}><option value="approved">Now (approved)</option><option value="pending">Later (pending)</option></select></label>
        </>) : (<>
          <label className="flex gap-3 items-start text-[15px]"><input type="checkbox" className="mt-1 w-5 h-5 shrink-0" checked={consent1} onChange={(e) => setConsent1(e.target.checked)} /><span>{CONSENT_DISPLAY} *</span></label>
          <label className="flex gap-3 items-start text-[15px]"><input type="checkbox" className="mt-1 w-5 h-5 shrink-0" checked={consent2} onChange={(e) => setConsent2(e.target.checked)} /><span>{CONSENT_REMOVAL} *</span></label>
        </>)}
      </div>

      {!admin && <input id="rv-website" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />}
      {!admin && SITE_KEY && <div ref={(el) => { turnstile.current.el = el; }} />}
      {err && <p role="alert" className="m-0 text-sm font-bold text-danger">{err}</p>}
      <button type="button" onClick={submit} disabled={!!busy} className="btn-primary w-full !h-14 text-lg">{busy ?? (admin ? "Add review" : "Send my review")}</button>
    </div>
  );
}

async function post(url: string, body: unknown) {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
  if (!r) throw new Error("No connection. Please check the internet and try again.");
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.message || "Something went wrong. Please try again.");
  return j;
}

/** PUT to the one-time signed URL (Supabase Storage, or the local stand-in), with upload progress. */
function put(url: string, it: Item, progress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open("PUT", url);
    x.setRequestHeader("content-type", it.type);
    x.setRequestHeader("x-upsert", "false");
    x.upload.onprogress = (e) => { if (e.lengthComputable) progress(Math.round((e.loaded / e.total) * 100)); };
    x.onload = () => (x.status >= 200 && x.status < 300 ? resolve() : reject(new Error("A file didn't upload. Please try again.")));
    x.onerror = () => reject(new Error("No connection. Please check the internet and try again."));
    x.send(it.blob);
  });
}

/** Max 1600 px on the long side, JPEG. Redrawing also drops the photo's hidden data (location, camera). */
async function shrink(file: File): Promise<Blob> {
  const src = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(async () => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await img.decode();
    return img;
  });
  const w = "naturalWidth" in src ? src.naturalWidth : src.width, h = "naturalHeight" in src ? src.naturalHeight : src.height;
  const k = Math.min(1, MAX_SIDE / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.round(w * k); c.height = Math.round(h * k);
  c.getContext("2d")!.drawImage(src, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("photo"))), "image/jpeg", 0.85));
}

function duration(f: File): Promise<number> {
  return new Promise((res) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => { URL.revokeObjectURL(v.src); res(Number.isFinite(v.duration) ? v.duration : 0); };
    v.onerror = () => res(0); // unreadable here (e.g. some MOV on Android): the admin checks it before approving
    v.src = URL.createObjectURL(f);
  });
}
