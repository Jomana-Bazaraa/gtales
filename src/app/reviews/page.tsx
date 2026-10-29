import type { Metadata } from "next";
import Link from "next/link";
import { Footer, Header } from "@/components/SiteChrome";
import { RatingSummary, ReviewsWall } from "@/components/reviews/ReviewsWall";
import { publicReviews } from "@/lib/reviews";

export const metadata: Metadata = { title: "Families love GTales — Reviews", description: "What parents in Egypt say about their child's GTales stories." };
export const dynamic = "force-dynamic";

/** All approved reviews (SPEC §5.6). */
export default async function ReviewsPage() {
  const { reviews, count, average } = await publicReviews();
  return (
    <>
      <Header />
      <main className="flex-1 w-full">
        <section className="mx-auto max-w-6xl px-4 py-8 md:py-12 flex flex-col gap-5">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div className="flex flex-col gap-2">
              <span className="eyebrow">Reviews</span>
              <h1 className="text-[30px] leading-9 md:text-[44px] md:leading-[48px] font-bold">Families love GTales</h1>
              <RatingSummary average={average} count={count} />
            </div>
            <Link href="/reviews/new" className="btn-primary self-start md:self-auto">Add your review</Link>
          </div>
          {reviews.length ? <ReviewsWall reviews={reviews} layout="list" /> : (
            <div className="card p-8 text-center flex flex-col gap-3 items-center">
              <p className="m-0 text-[17px] font-bold">No reviews yet.</p>
              <p className="m-0 text-ink-soft">Made a story with your child? Be the first family to share how it went.</p>
              <Link href="/reviews/new" className="btn-secondary">Add your review</Link>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
