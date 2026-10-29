import type { Metadata } from "next";
import { Footer, Header, PromoBar } from "@/components/SiteChrome";
import { Faq, FinalCta, Hero, HowItWorks, MeetTheBook, Pricing, Superpowers } from "@/components/landing/Landing";
import { FamiliesLoveGTales } from "@/components/reviews/ReviewsWall";
import { publicReviews } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "GTales — A personalised storybook where your child is the hero",
  description:
    "Three printed books with your child's face in every picture, built around their strengths and struggles. You approve every page. Pay on delivery. Try a free story first.",
};

/** Landing page — docs/SPEC.md §5. Seven sections, same order on phone and desktop. */
export const dynamic = "force-dynamic";

export default async function Home() {
  const { reviews, count, average } = await publicReviews(12).catch(() => ({ reviews: [], count: 0, average: 0 }));
  return (
    <>
      <PromoBar />
      <Header landing />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <MeetTheBook />
        <Superpowers />
        <Pricing />
        <FamiliesLoveGTales reviews={reviews} count={count} average={average} />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
