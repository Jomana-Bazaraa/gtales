import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isValidAdminCookie } from "@/lib/admin-auth";
import { taleBySlug } from "@/lib/gtales";
import { listReviews, signMedia, type ReviewStatus } from "@/lib/reviews";
import { Stars } from "@/components/reviews/ReviewsWall";

export const dynamic = "force-dynamic";
const TABS: ReviewStatus[] = ["pending", "approved", "hidden"];
const badge: Record<ReviewStatus, string> = { pending: "bg-sun-soft text-cta-shadow", approved: "bg-mint-soft text-mint", hidden: "bg-cream-deep text-ink-soft" };

/** Admin → Reviews (SPEC §11): approve, hide, feature (pin to top), delete (with media), add by hand. */
export default async function AdminReviews({ searchParams }: PageProps<"/admin/reviews">) {
  const store = await cookies();
  if (!isValidAdminCookie(store.get("estoria_admin")?.value)) redirect("/admin/login");
  const sp = await searchParams;
  const status: ReviewStatus = TABS.includes(sp.status as ReviewStatus) ? (sp.status as ReviewStatus) : "pending";
  const all = await listReviews(undefined, 1000);
  const rows = all.filter((r) => r.status === status).sort((a, b) => Number(b.featured) - Number(a.featured) || (a.created_at < b.created_at ? 1 : -1));
  const urls = await signMedia(rows.flatMap((r) => r.media.map((m) => m.path)), 3600);
  let k = 0;
  const back = `/admin/reviews?status=${status}`;
  const Btn = ({ id, action, label, cls = "btn-ghost" }: { id: string; action: string; label: string; cls?: string }) => (
    <form action={`/api/admin/reviews/${id}`} method="post"><input type="hidden" name="action" value={action} /><input type="hidden" name="back" value={back} /><button className={`${cls} !h-9 !min-h-9 !px-3 text-sm`}>{label}</button></form>
  );
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Reviews</h1>
        <Link href="/admin/reviews/new" className="btn-primary !h-10 !px-4 text-sm">+ Add a review</Link>
      </div>
      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => <a key={t} href={`/admin/reviews?status=${t}`} className={`chip !min-h-9 ${t === status ? "chip-on" : ""}`}>{t[0].toUpperCase() + t.slice(1)} ({all.filter((r) => r.status === t).length})</a>)}
      </div>
      {!rows.length && <p className="text-ink-soft">No {status} reviews.</p>}
      {rows.map((r) => {
        const media = r.media.map((m) => ({ ...m, url: urls[k++] }));
        return (
          <article key={r.id} className="card p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap text-sm">
              <Stars n={r.rating} className="text-[18px]" />
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${badge[r.status]}`}>{r.status}</span>
              {r.featured && <span className="rounded-full px-2 py-0.5 text-xs font-bold bg-flame-soft text-flame-deep">featured</span>}
              <span className="text-ink-soft">{new Date(r.created_at).toLocaleString("en-GB", { timeZone: "Africa/Cairo" })} · {r.source === "admin" ? "added by admin" : "form"}{r.story_slug ? ` · ${taleBySlug(r.story_slug)?.title ?? r.story_slug}` : ""}</span>
            </div>
            <p className="m-0 font-bold">{[r.first_name, r.city, r.child_age ? `child ${r.child_age}` : null].filter(Boolean).join(" · ")}</p>
            <p className="m-0 whitespace-pre-line text-[15px] leading-[22px]">{r.text}</p>
            {media.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {media.map((m, j) => !m.url ? <span key={j} className="text-xs text-danger">file missing</span> : m.type === "video"
                  ? <video key={j} src={m.url} controls playsInline preload="metadata" className="h-40 rounded-xl bg-black" />
                  // eslint-disable-next-line @next/next/no-img-element
                  : <a key={j} href={m.url} target="_blank" rel="noreferrer"><img src={m.url} alt="" loading="lazy" className="h-40 w-40 object-cover rounded-xl" /></a>)}
              </div>
            )}
            <p className="m-0 text-xs text-ink-soft">Consent: {new Date(r.consent_at).toLocaleString("en-GB", { timeZone: "Africa/Cairo" })} {r.source === "admin" ? "(admin confirmed the parent agreed)" : "(both boxes ticked by the parent)"}</p>
            <div className="flex gap-2 flex-wrap items-center">
              {r.status !== "approved" && <Btn id={r.id} action="approve" label="Approve" cls="btn-primary" />}
              {r.status !== "hidden" && <Btn id={r.id} action="hide" label="Hide" />}
              {r.featured ? <Btn id={r.id} action="unfeature" label="Unpin" /> : <Btn id={r.id} action="feature" label="Feature (pin to top)" />}
              <details className="ms-auto">
                <summary className="list-none cursor-pointer text-sm font-bold text-danger">Delete…</summary>
                <div className="mt-2"><Btn id={r.id} action="delete" label="Yes, delete the review and its files" cls="btn-ghost !text-danger" /></div>
              </details>
            </div>
          </article>
        );
      })}
    </div>
  );
}
