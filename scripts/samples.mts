/**
 * Generates one complete sample book per struggle (EN + AR) through the REAL pipeline
 * (1 Gemini text call + 2 Gemini image calls each) and writes a single self-contained
 * review page: samples/index.html (images embedded). No Chrome / PDF needed.
 *
 *   npm run samples            → all 11 struggles × 2 languages (22 books, ≈ $1.60)
 *   npm run samples -- anger   → only that struggle
 *   npm run samples -- anger en
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";

// ---- load .env.local (no dotenv dependency) ----
const envFile = path.join(process.cwd(), ".env.local");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
if (!process.env.GEMINI_API_KEY) {
  console.error("\n✗ GEMINI_API_KEY is empty. Open .env.local and paste your key after GEMINI_API_KEY=\n");
  process.exit(1);
}
// force the local file store for samples, whatever else is configured
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
const WANT_PDF = !!process.env.PUPPETEER_EXECUTABLE_PATH && existsSync(process.env.PUPPETEER_EXECUTABLE_PATH);
process.env.PDF_DISABLED = WANT_PDF ? "" : "1";
process.env.ILLUSTRATION_MODE = process.env.ILLUSTRATION_MODE || "full"; // samples: every page illustrated

const { STRUGGLES, KEEPERS } = await import("../src/lib/keepers");
const { insertStory, getStory } = await import("../src/lib/db");
const { runTextAndImages } = await import("../src/lib/pipeline");
const { nanoid } = await import("nanoid");
type Lang = "en" | "ar";

const onlyStruggle = process.argv[2];
const onlyLang = process.argv[3] as Lang | undefined;

// one challenge type per story so every activity type appears at least once
const challengeFor: Record<string, string> = {
  anger: "maze", violence: "choose_path", bullying_others: "choose_path", anxiety: "riddle", friendship: "choose_path",
  sibling: "dots", confidence: "math", emotions: "wordsearch", loss: "hidden_objects", bullied: "choose_path", lying: "choose_path",
};

const SAMPLE = (lang: Lang) => ({
  childName: lang === "ar" ? "آدم" : "Adam",
  age: 6,
  gender: "boy" as const,
  appearance: { skinTone: "medium", hairStyle: "short", hairColor: "dark_brown", details: "" },
  interests: [lang === "ar" ? "كورة" : "football"],
  sidekick: { name: lang === "ar" ? "عمر" : "Omar", relation: "sibling" as const },
  vibe: "funny" as const,
  personalDetail: lang === "ar" ? "لما أخوه عمر يلمس كروته، بيقول 'مش عدل!' بصوت عالي وبيخبط برجله" : "When his brother Omar touches his cards he shouts 'That's not fair!' and stomps off",
  parentName: "Ayman",
  parentEmail: "samples@estoria.kids",
  language: lang,
  consent: true as const,
});

const ids: Array<{ id: string; struggle: string; lang: Lang }> = [];
for (const s of STRUGGLES) {
  if (s.id === "other") continue;
  if (onlyStruggle && s.id !== onlyStruggle) continue;
  for (const lang of ["en", "ar"] as Lang[]) {
    if (onlyLang && lang !== onlyLang) continue;
    const id = `sample-${s.id}-${lang}-${nanoid(6)}`;
    const now = new Date().toISOString();
    await insertStory({
      id, status: "pending", progress: "template",
      input: { ...SAMPLE(lang), struggle: s.id, challengeType: challengeFor[s.id] as never },
      keeper_id: null, generated: null, assembled: null, cover_url: null, lineart_url: null, pdf_color_url: null, pdf_lineart_url: null,
      error: null, email_sent_at: null, created_at: now, updated_at: now,
    });
    process.stdout.write(`→ ${s.id} (${lang}) … `);
    try {
      await runTextAndImages(id);
      console.log("ok");
      ids.push({ id, struggle: s.id, lang });
    } catch (e) {
      console.log("FAILED:", e instanceof Error ? e.message : e);
    }
  }
}

// ---- optional: real parent-facing PDFs (needs a built app + Chrome path in .env.local) ----
const pdfLinks: Record<string, { color: string; lineart: string }> = {};
if (WANT_PDF && ids.length) {
  const { spawn } = await import("node:child_process");
  const { renderStoryPdf } = await import("../src/lib/pdf");
  const { copyFileSync } = await import("node:fs");
  const port = 3123;
  console.log("\nRendering PDFs (starting the app on port " + port + ")…");
  const server = spawn(process.platform === "win32" ? "npx.cmd" : "npx", ["next", "start", "-p", String(port)], { stdio: "ignore", shell: process.platform === "win32" });
  const base = `http://localhost:${port}`;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(base)).ok) break; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 1000));
  }
  mkdirSync("samples", { recursive: true });
  for (const r of ids) {
    try {
      const color = await renderStoryPdf(r.id, "color", base);
      const lineart = await renderStoryPdf(r.id, "lineart", base);
      const src = (u: string) => path.join(process.cwd(), ".data", "files", u.replace(/^\/api\/files\//, ""));
      const c = `${r.struggle}-${r.lang}-book.pdf`, l = `${r.struggle}-${r.lang}-activity.pdf`;
      copyFileSync(src(color), path.join("samples", c));
      copyFileSync(src(lineart), path.join("samples", l));
      pdfLinks[r.id] = { color: c, lineart: l };
      console.log(`  ✓ ${c}, ${l}`);
    } catch (e) {
      console.log(`  ✗ PDF for ${r.id}: ${e instanceof Error ? e.message : e}`);
    }
  }
  server.kill();
} else if (!WANT_PDF) {
  console.log("\n(PDFs skipped — set PUPPETEER_EXECUTABLE_PATH in .env.local to your Chrome path and run `npm run build` once to get the real parent PDFs)");
}

// ---- build the review page ----
const dataFiles = path.join(process.cwd(), ".data", "files");
const img = (url: string | null) => {
  if (!url) return "";
  const rel = url.replace(/^\/api\/files\//, "");
  const p = path.join(dataFiles, rel);
  if (!existsSync(p)) return "";
  const ext = path.extname(p).slice(1);
  const mime = ext === "svg" ? "image/svg+xml" : ext === "jpg" ? "image/jpeg" : `image/${ext}`;
  return `data:${mime};base64,${readFileSync(p).toString("base64")}`;
};
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

let html = `<!doctype html><html><head><meta charset="utf-8"><title>Estoria samples</title>
<style>body{font-family:Nunito,Segoe UI,Tahoma,sans-serif;background:#fff8ef;color:#2a2320;margin:0;padding:24px;max-width:960px;margin:auto}
h1{color:#e8673f}nav a{display:inline-block;margin:4px 8px 4px 0;color:#2b2d6b}
.book{background:#fff;border:1px solid #ead9c6;border-radius:20px;padding:24px;margin:28px 0}
.book[dir=rtl]{font-family:Cairo,Tahoma,sans-serif}
.imgs{display:grid;grid-template-columns:1fr 1fr;gap:12px}.imgs img{width:100%;border-radius:12px;border:1px solid #ead9c6}
.page{margin:14px 0;padding:12px 16px;border-inline-start:4px solid #fbe3d8}.page p{font-size:18px;line-height:1.7}
.ai{background:#fbe3d8;border-radius:10px;padding:10px;font-size:14px}.ch{background:#e4e5f7;border-radius:10px;padding:10px;font-size:14px}
small{color:#6b5f58}</style></head><body><h1>Estoria — sample books</h1><p><small>Generated ${new Date().toLocaleString()} · Adam, 6, football, brother Omar · real Gemini text + images</small></p><nav>`;
for (const r of ids) html += `<a href="#${r.id}">${r.struggle} ${r.lang}</a>`;
html += `</nav>`;
for (const r of ids) {
  const s = await getStory(r.id);
  if (!s?.assembled) continue;
  const k = KEEPERS[s.assembled.keeper];
  html += `<section class="book" id="${r.id}" dir="${r.lang === "ar" ? "rtl" : "ltr"}"><h2>${esc(s.assembled.title)}</h2><small>${r.struggle} · ${k.name[r.lang]} · challenge: ${s.input.challengeType}</small>
  ${pdfLinks[r.id] ? `<p><a href="${pdfLinks[r.id].color}">📕 Story PDF (what the parent gets)</a> · <a href="${pdfLinks[r.id].lineart}">✏️ Activity PDF</a></p>` : ""}
  <div class="imgs"><img src="${img(s.cover_url)}" alt="cover"><img src="${img(s.lineart_url)}" alt="line art"></div>
  <p class="ai"><b>Workshop activities in this book:</b> ${s.assembled.workshop.join(", ")} + badge + parent page</p>
  <p class="ai"><b>Illustration mode:</b> ${process.env.ILLUSTRATION_MODE}<br><b>AI sentence:</b> ${esc(s.generated?.personal_detail_text ?? "")}<br><b>Interest phrases:</b> ${esc(JSON.stringify(s.generated?.interest_phrases))}<br><b>Cover scene:</b> ${esc(s.generated?.cover_scene ?? "")}</p>`;
  let n = 0;
  for (const p of s.assembled.pages) {
    if (p.kind === "text") html += `<div class="page"><small>${r.lang === "ar" ? "صفحة" : "Page"} ${++n}</small>${p.imageUrl ? `<img src="${img(p.imageUrl)}" style="width:100%;max-width:640px;border-radius:12px;border:1px solid #ead9c6;display:block;margin:8px 0">` : ""}${p.paragraphs!.map((t) => `<p>${esc(t)}</p>`).join("")}</div>`;
    if (p.kind === "challenge") {
      const c = s.generated?.challenge;
      html += `<div class="ch"><b>Challenge (${s.input.challengeType})</b>${c ? `<br>${esc(c.title)}: ${esc(c.prompt)}${c.options ? "<br>• " + c.options.map(esc).join("<br>• ") : ""}<br><i>answer: ${esc(c.answer)}</i>` : " — code-generated puzzle (see app)"}</div>`;
    }
  }
  html += `<p class="ai"><b>Parent questions:</b><br>${(s.generated?.parent_tips ?? []).map(esc).join("<br>")}</p></section>`;
}
html += `</body></html>`;
mkdirSync("samples", { recursive: true });
writeFileSync(path.join("samples", "index.html"), html);
console.log(`\n✓ ${ids.length} books → samples/index.html  (open it in any browser)`);
