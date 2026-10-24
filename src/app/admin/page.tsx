import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isValidAdminCookie } from "@/lib/admin-auth";
import { listBooks, listPdfJobs } from "@/lib/db";
import { taleBySlug } from "@/lib/gtales";
import { waLink } from "@/lib/whatsapp";
import { baseUrl } from "@/lib/site";
import type { PdfJob } from "@/lib/types";

export const dynamic = "force-dynamic";

const badge: Record<PdfJob["status"] | "ready" | "none", string> = { ready: "bg-teal-soft text-teal-900", done: "bg-teal-soft text-teal-900", queued: "bg-indigo-soft text-indigo", running: "bg-indigo-soft text-indigo", failed: "bg-coral-soft text-coral-dark", none: "bg-cream-deep" };

/** Admin → Free stories (SPEC §11): every book, its PDF state, and Generate PDF (queues the GitHub Action). */
export default async function AdminStories() {
  const store = await cookies();
  if (!isValidAdminCookie(store.get("estoria_admin")?.value)) redirect("/admin/login");
  const [books, jobs] = await Promise.all([listBooks(300), listPdfJobs(1000)]);
  const site = await baseUrl();
  const lastJob = new Map<string, PdfJob>();
  for (const j of jobs) if (!lastJob.has(j.book_id)) lastJob.set(j.book_id, j); // newest first
  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Free stories <span className="text-ink-soft text-base font-normal">({books.length})</span></h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream-deep/60 text-left text-xs uppercase text-ink-soft">
            <tr><th className="p-3">When</th><th className="p-3">Child</th><th className="p-3">Parent</th><th className="p-3">Story</th><th className="p-3">Source</th><th className="p-3">PDF</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {books.map((b) => {
              const j = lastJob.get(b.id);
              const state = b.pdf_url ? "ready" : j ? j.status : "none";
              return (
                <tr key={b.id} className="border-t border-line align-top">
                  <td className="p-3 whitespace-nowrap text-ink-soft">{new Date(b.created_at).toLocaleString("en-GB", { timeZone: "Africa/Cairo" })}</td>
                  <td className="p-3 font-semibold">{b.child_name} <span className="text-ink-soft font-normal">({b.form.age}, {b.gender})</span></td>
                  <td className="p-3">{b.parent_name}<br />{(b.contact ?? "").includes("@") ? <a className="text-indigo" href={`mailto:${b.contact}`}>{b.contact}</a> : b.contact && <a className="text-indigo" target="_blank" rel="noreferrer" href={waLink(b.contact, `Hi! Here is ${b.child_name}'s GTales story: ${site}/story/${b.id}`)}>WhatsApp {b.contact}</a>}</td>
                  <td className="p-3">{taleBySlug(b.slug)?.title ?? b.slug}{b.polished && <span className="ms-1 text-[10px] font-bold uppercase bg-coral-soft text-coral-dark rounded px-1">AI</span>}</td>
                  <td className="p-3 text-ink-soft">{b.ref || "direct"}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${badge[state]}`}>{state === "none" ? "not made" : state}</span>
                    {j?.error && !b.pdf_url && <div className="text-[11px] text-coral-dark max-w-[220px] break-words mt-1">{j.error}</div>}
                    {b.pdf_url && <div className="mt-1"><a href={b.pdf_url} target="_blank" rel="noreferrer" className="text-coral font-bold">Open PDF ↗</a></div>}
                  </td>
                  <td className="p-3 whitespace-nowrap flex flex-col gap-1">
                    <Link href={`/story/${b.id}`} className="text-coral font-bold" target="_blank">Open ↗</Link>
                    <form action="/api/admin/pdf" method="post">
                      <input type="hidden" name="book_id" value={b.id} />
                      {b.pdf_url && <input type="hidden" name="force" value="1" />}
                      <button className="text-indigo font-bold">{b.pdf_url ? "Regenerate PDF" : "Generate PDF"}</button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {!books.length && <tr><td className="p-6 text-center text-ink-soft" colSpan={7}>No free stories yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-ink-soft">A PDF takes about two minutes: the GitHub Action renders it and this page shows &ldquo;ready&rdquo;. Reload to update.</p>
    </>
  );
}
