import type { Metadata } from "next";
import { Footer, Header, PromoBar } from "@/components/SiteChrome";
import { Faq, FinalCta, Hero, HowItWorks, MeetTheBook, Pricing, Superpowers } from "@/components/landing/Landing";
import { COPY } from "@/lib/gtales";

export const metadata: Metadata = {
  title: "GTales — A personalised storybook where your child is the hero",
  description:
    "Five printed books with your child's face in every picture, built around their strengths and struggles. You approve every page. Pay on delivery. Try a free story first.",
};

/** Landing page — docs/SPEC.md §5. Seven sections, same order on phone and desktop. */
export default function Home() {
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
        {COPY.reviewsVisible && null /* Reviews: hidden until three real reviews exist (SPEC §2.6) */}
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
