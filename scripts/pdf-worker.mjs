#!/usr/bin/env node
/**
 * Renders queued story PDFs (SPEC §8, LAUNCH-PLAN §1). Run by .github/workflows/pdf.yml, or locally:
 *   npm run pdf:jobs                      every queued job (mock store in .data/ when Supabase env is empty)
 *   JOB_ID=<id> npm run pdf:jobs          that job first, then any other queued ones
 *
 * Env: SITE_URL (live site, e.g. https://gtales.kids) · INTERNAL_RENDER_TOKEN · SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY
 *      PUPPETEER_EXECUTABLE_PATH (default /usr/bin/google-chrome)
 * Standalone on purpose: needs only puppeteer-core and @supabase/supabase-js, so the Action installs two packages, not the app.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const SITE = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
const TOKEN = process.env.INTERNAL_RENDER_TOKEN || "";
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/google-chrome";
const MAX_JOBS = 25;
const now = () => new Date().toISOString();

const store = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? await supabaseStore() : mockStore();

const jobs = await store.queued();
const first = process.env.JOB_ID;
jobs.sort((a, b) => (a.id === first ? -1 : b.id === first ? 1 : a.created_at < b.created_at ? -1 : 1));
console.log(`[pdf] ${jobs.length} queued job(s) · site ${SITE}`);
if (!jobs.length) process.exit(0);

const browser = await puppeteer.launch({ executablePath: CHROME, args: ["--no-sandbox", "--disable-setuid-sandbox"], headless: true });
let failed = 0;
try {
  for (const job of jobs.slice(0, MAX_JOBS)) {
    if (!(await store.claim(job))) continue; // another run took it
    const t0 = Date.now();
    try {
      const book = await store.book(job.book_id);
      if (!book) throw new Error("book not found");
      const url = book.pdf_url || (await render(job.book_id));
      await store.finish(job, url);
      console.log(`[pdf] ${job.id} book ${job.book_id} done in ${Date.now() - t0} ms → ${url}`);
    } catch (e) {
      failed++;
      const msg = e instanceof Error ? e.message : String(e);
      await store.fail(job, msg);
      console.error(`[pdf] ${job.id} book ${job.book_id} FAILED: ${msg}`);
    }
  }
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);

/** Same steps as SPEC §8: template HTML, A4, printBackground, zero margins, fitPages after fonts and images. */
async function render(bookId) {
  const page = await browser.newPage();
  try {
    const warnings = [];
    page.on("console", (m) => { if (m.type() === "warn" && m.text().includes("GTales")) warnings.push(m.text()); });
    const res = await page.goto(`${SITE}/story/${bookId}/print?token=${encodeURIComponent(TOKEN)}`, { waitUntil: "load", timeout: 90_000 });
    if (!res || !res.ok()) throw new Error(`print page returned ${res ? res.status() : "nothing"}`);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(Array.from(document.images).filter((i) => !i.complete).map((i) => new Promise((r) => { i.onload = () => r(); i.onerror = () => r(); })));
      const broken = Array.from(document.images).filter((i) => !i.naturalWidth).map((i) => i.src);
      if (broken.length) throw new Error(`images failed to load: ${broken.slice(0, 3).join(", ")}`);
      window.GTales.fitPages(document.getElementById("book"));
    });
    if (warnings.length) console.warn("[pdf]", warnings.join("; "));
    const pdf = Buffer.from(await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true, margin: { top: "0", bottom: "0", left: "0", right: "0" } }));
    const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
    if (pages !== 17) console.warn(`[pdf] book ${bookId}: ${pages} pages (expected 17)`);
    return store.upload(`${bookId}/story.pdf`, pdf);
  } finally {
    await page.close();
  }
}

async function supabaseStore() {
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const check = ({ error }) => { if (error) throw new Error(error.message); };
  return {
    async queued() {
      const { data, error } = await sb.from("pdf_jobs").select("*").eq("status", "queued").order("created_at").limit(MAX_JOBS);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    async claim(job) {
      const { data } = await sb.from("pdf_jobs").update({ status: "running", attempts: job.attempts + 1, updated_at: now() }).eq("id", job.id).eq("status", "queued").select("id");
      return !!data?.length;
    },
    async book(id) {
      const { data } = await sb.from("books").select("id, pdf_url").eq("id", id).maybeSingle();
      return data;
    },
    async upload(key, bytes) {
      check(await sb.storage.from("pdfs").upload(key, bytes, { contentType: "application/pdf", upsert: true }));
      return sb.storage.from("pdfs").getPublicUrl(key).data.publicUrl;
    },
    async finish(job, url) {
      check(await sb.from("books").update({ pdf_url: url, updated_at: now() }).eq("id", job.book_id));
      check(await sb.from("pdf_jobs").update({ status: "done", pdf_url: url, error: null, updated_at: now() }).eq("id", job.id));
    },
    async fail(job, error) {
      await sb.from("pdf_jobs").update({ status: "failed", error: error.slice(0, 500), updated_at: now() }).eq("id", job.id);
    },
  };
}

/** Local dev: the app's mock store (.data/), same layout as src/lib/db.ts. */
function mockStore() {
  const dir = path.join(process.cwd(), ".data");
  const file = (kind, id) => path.join(dir, kind, `${encodeURIComponent(id)}.json`);
  const read = async (kind, id) => JSON.parse(await fs.readFile(file(kind, id), "utf8").catch(() => "null"));
  const write = async (kind, id, v) => { await fs.mkdir(path.join(dir, kind), { recursive: true }); await fs.writeFile(file(kind, id), JSON.stringify(v, null, 2)); };
  const patch = async (kind, id, p) => { const cur = await read(kind, id); if (cur) await write(kind, id, { ...cur, ...p, updated_at: now() }); };
  return {
    async queued() {
      const names = await fs.readdir(path.join(dir, "pdf_jobs")).catch(() => []);
      const all = await Promise.all(names.filter((n) => n.endsWith(".json")).map((n) => fs.readFile(path.join(dir, "pdf_jobs", n), "utf8").then(JSON.parse)));
      return all.filter((j) => j.status === "queued");
    },
    async claim(job) { await patch("pdf_jobs", job.id, { status: "running", attempts: job.attempts + 1 }); return true; },
    book: (id) => read("books", id),
    async upload(key, bytes) {
      await fs.mkdir(path.dirname(path.join(dir, "files", key)), { recursive: true });
      await fs.writeFile(path.join(dir, "files", key), bytes);
      return `/api/files/${key}`;
    },
    async finish(job, url) { await patch("books", job.book_id, { pdf_url: url }); await patch("pdf_jobs", job.id, { status: "done", pdf_url: url, error: null }); },
    async fail(job, error) { await patch("pdf_jobs", job.id, { status: "failed", error }); },
  };
}
