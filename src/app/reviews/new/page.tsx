import type { Metadata } from "next";
import { Footer, Header } from "@/components/SiteChrome";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { taleBySlug } from "@/lib/gtales";

export const metadata: Metadata = { title: "Add your review — GTales", robots: { index: false } };

/** Public review form (SPEC §5.6). `?tale=<slug>` when it comes from the end of a free story. */
export default async function NewReviewPage({ searchParams }: PageProps<"/reviews/new">) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.tale) ? sp.tale[0] : sp.tale;
  const tale = raw && taleBySlug(raw) ? raw : undefined;
  return (
    <>
      <Header />
      <main className="flex-1 w-full bg-white">
        <section className="mx-auto max-w-xl px-4 py-8 md:py-12 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="eyebrow">Your review</span>
            <h1 className="text-[28px] leading-8 md:text-[36px] md:leading-10 font-bold text-balance">How did your child like it?</h1>
            <p className="m-0 text-ink-soft">Other parents read these before they try a story. It takes two minutes.</p>
          </div>
          <ReviewForm mode="public" tale={tale} />
        </section>
      </main>
      <Footer />
    </>
  );
}
