import Link from "next/link";
import { cookies } from "next/headers";
import { Footer, Header } from "@/components/SiteChrome";
import { Hero } from "@/components/landing/Hero";
import { FinalCta, HowItWorks, MeetTheKeepers } from "@/components/landing/Sections";
import { StoryBook } from "@/components/story/StoryBook";
import { showcaseStory } from "@/lib/showcase";
import { t, type Lang } from "@/lib/i18n";

export default async function Home() {
  const store = await cookies();
  const lang = (store.get("lang")?.value === "ar" ? "ar" : "en") as Lang;
  const sample = await showcaseStory(lang);
  // Landing shows the first 3 pages; full story on /showcase
  const preview = { ...sample, assembled: { ...sample.assembled!, pages: sample.assembled!.pages.slice(0, 3) } };
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <section id="showcase" className="bg-cream-deep/60 py-12 sm:py-20">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-2">{t("showcase_title", lang)}</h2>
            <p className="text-center text-ink-soft mb-8">{t("showcase_sub", lang)}</p>
            <StoryBook story={preview} mode="web" />
            <div className="text-center mt-6">
              <Link href="/showcase" className="btn-secondary">{t("showcase_open", lang)}</Link>
            </div>
          </div>
        </section>
        <MeetTheKeepers />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
