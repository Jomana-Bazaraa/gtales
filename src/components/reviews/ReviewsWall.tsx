/**
 * "Families love GTales" (SPEC §5.6). Approved reviews only, featured first. Shows first name, city and
 * child's age, never a child's full name. Phone: swipeable cards (home) or a list (/reviews); desktop: masonry.
 */
import Link from "next/link";
import type { PublicReview } from "@/lib/reviews";
import { VideoTile } from "./VideoTile";

export function Stars({ n, className = "" }: { n: number; className?: string }) {
  return <span className={`text-[#f5a623] tracking-[1px] ${className}`} aria-label={`${n} out of 5 stars`}>{"★".repeat(n)}<span className="text-line">{"★".repeat(5 - n)}</span></span>;
}

export function RatingSummary({ average, count }: { average: number; count: number }) {
  if (count < 3) return null; // SPEC: average and count only once there are 3 approved reviews
  return (
    <p className="m-0 flex items-center gap-2 text-[15px] font-bold">
      <Stars n={Math.round(average)} className="text-[20px]" /> {average.toFixed(1)} out of 5 · {count} reviews
    </p>
  );
}

function ReviewCard({ r }: { r: PublicReview }) {
  const who = [r.first_name, r.city, r.child_age ? `child ${r.child_age}` : null].filter(Boolean).join(" · ");
  const long = r.text.length > 420;
  return (
    <article className="card p-4 flex flex-col gap-3 break-inside-avoid">
      <div className="flex items-center justify-between gap-2"><Stars n={r.rating} className="text-[18px]" />{r.featured && <span className="pill bg-sun-soft text-cta-shadow text-[11px]">Featured</span>}</div>
      {r.media.length > 0 && (
        <div className={`grid gap-2 ${r.media.length > 1 ? "grid-cols-2" : ""}`}>
          {r.media.map((m, k) => m.type === "video"
            ? <div key={k} className={r.media.length > 1 ? "col-span-2" : ""}><VideoTile src={m.url} /></div>
            // eslint-disable-next-line @next/next/no-img-element
            : <img key={k} src={m.url} alt={`Photo from ${r.first_name}'s family`} loading="lazy" decoding="async" className="w-full aspect-square object-cover rounded-xl bg-surface-tint" />)}
        </div>
      )}
      {long ? (
        <details className="group text-[15px] leading-[22px]">
          <summary className="list-none cursor-pointer"><span className="whitespace-pre-line">{r.text.slice(0, 420)}…</span> <span className="font-bold text-sky group-open:hidden">Read more</span></summary>
          <p className="m-0 whitespace-pre-line">{r.text.slice(420)}</p>
        </details>
      ) : <p className="m-0 text-[15px] leading-[22px] whitespace-pre-line">{r.text}</p>}
      <p className="m-0 text-sm font-bold text-ink-soft">{who}</p>
    </article>
  );
}

/** layout "swipe": horizontal snap cards on phones (home); "list": stacked on phones (/reviews). Masonry from md up. */
export function ReviewsWall({ reviews, layout }: { reviews: PublicReview[]; layout: "swipe" | "list" }) {
  return (
    <div className={layout === "swipe"
      ? "-mx-4 px-4 flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 md:mx-0 md:px-0 md:block md:columns-3 md:gap-4 md:overflow-visible [&>*]:snap-start [&>*]:shrink-0 [&>*]:w-[85%] md:[&>*]:w-auto md:[&>*]:mb-4"
      : "flex flex-col gap-3 md:block md:columns-3 md:gap-4 md:[&>*]:mb-4"}>
      {reviews.map((r) => <ReviewCard key={r.id} r={r} />)}
    </div>
  );
}

/** Home section; renders nothing until there is at least one approved review (no fake content, SPEC §2.6). */
export function FamiliesLoveGTales({ reviews, count, average }: { reviews: PublicReview[]; count: number; average: number }) {
  if (!reviews.length) return null;
  return (
    <section id="reviews" className="scroll-mt-16">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-16 flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-2">
          <span className="eyebrow">Reviews</span>
          <h2 className="text-[28px] leading-8 md:text-[38px] md:leading-[42px] font-bold">Families love GTales</h2>
          <RatingSummary average={average} count={count} />
        </div>
        <ReviewsWall reviews={reviews} layout="swipe" />
        <div className="flex gap-2 flex-wrap">
          <Link href="/reviews" className="btn-secondary">Read all reviews</Link>
          <Link href="/reviews/new" className="btn-ghost">Add your review</Link>
        </div>
      </div>
    </section>
  );
}
