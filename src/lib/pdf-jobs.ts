/**
 * Story PDFs (SPEC §8, LAUNCH-PLAN §1). The web app runs on Cloudflare Workers, which can't run Chrome,
 * so a PDF is a job: insert a row in `pdf_jobs`, then start the GitHub Action (workflow_dispatch).
 * The Action (scripts/pdf-worker.mjs) renders /story/[id]/print, uploads to the `pdfs` bucket, sets books.pdf_url.
 *
 * GITHUB_PDF_TOKEN  fine-grained token, this repo only, "Actions: read and write"
 * GITHUB_PDF_REPO   owner/repo (default Jomana-Bazaraa/gtales) · GITHUB_PDF_REF  branch (default main)
 * Without a token the job stays queued; run `npm run pdf:jobs` locally to render it.
 */
import { nanoid } from "nanoid";
import { getBook, insertPdfJob, latestPdfJob, updatePdfJob } from "./db";
import type { PdfJob } from "./types";

/** Story PDFs are hidden from parents (Jomana, 29 Oct): the backend stays, reachable only when PDF_ENABLED=true (admin always). */
export const PDF_ENABLED = process.env.PDF_ENABLED === "true";

/** A queued/running job older than this is treated as lost and queued again. */
const STALE_MS = 10 * 60_000;

export type PdfState = { status: "done"; url: string } | { status: "queued" | "running" | "failed"; job: PdfJob };

export async function pdfState(bookId: string): Promise<PdfState | null> {
  const book = await getBook(bookId);
  if (!book) return null;
  if (book.pdf_url) return { status: "done", url: book.pdf_url };
  const job = await latestPdfJob(bookId);
  if (!job) return null;
  if (job.status === "done" && job.pdf_url) return { status: "done", url: job.pdf_url };
  return { status: job.status === "done" ? "queued" : job.status, job };
}

/** Returns the PDF if it exists, otherwise makes sure exactly one live job is queued for it. */
export async function requestPdf(bookId: string, by: PdfJob["requested_by"], force = false): Promise<PdfState | null> {
  const cur = await pdfState(bookId);
  if (cur === null && !(await getBook(bookId))) return null;
  if (cur?.status === "done" && !force) return cur;
  if (cur && cur.status !== "done" && cur.status !== "failed" && !force && Date.now() - Date.parse(cur.job.updated_at) < STALE_MS) return cur;
  const now = new Date().toISOString();
  const job: PdfJob = { id: nanoid(12), book_id: bookId, status: "queued", requested_by: by, pdf_url: null, error: null, attempts: 0, created_at: now, updated_at: now };
  await insertPdfJob(job);
  try {
    await dispatch(job.id);
  } catch (e) {
    const error = `dispatch: ${e instanceof Error ? e.message : String(e)}`;
    console.error("[pdf]", error);
    await updatePdfJob(job.id, { error });
    return { status: "queued", job: { ...job, error } };
  }
  return { status: "queued", job };
}

async function dispatch(jobId: string): Promise<void> {
  const token = process.env.GITHUB_PDF_TOKEN;
  if (!token) {
    console.warn(`[pdf] GITHUB_PDF_TOKEN not set: job ${jobId} stays queued (npm run pdf:jobs renders it locally)`);
    return;
  }
  const repo = process.env.GITHUB_PDF_REPO || "Jomana-Bazaraa/gtales";
  const res = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/pdf.yml/dispatches`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28", "user-agent": "gtales-web" },
    body: JSON.stringify({ ref: process.env.GITHUB_PDF_REF || "main", inputs: { job_id: jobId } }),
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${(await res.text()).slice(0, 200)}`);
}
