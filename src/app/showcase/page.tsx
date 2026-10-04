import Link from "next/link";
import { cookies } from "next/headers";
import { Footer, Header } from "@/components/SiteChrome";
import { StoryBook } from "@/components/story/StoryBook";
import { showcaseStory } from "@/lib/showcase";
import { t, type Lang } from "@/lib/i18n";

export default async function ShowcasePage() {
  const store = await cookies();
  const lang = (store.get("lang")?.value === "ar" ? "ar" : "en") as Lang;
  const sample = await showcaseStory(lang);
  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-3xl px-4 py-8 w-full">
        <p className="text-center text-sm text-ink-soft mb-4">{t("showcase_sub", lang)}</p>
        <StoryBook story={sample} mode="web" />
        <div className="text-center mt-10">
          <Link href="/create" className="btn-primary text-lg">{t("cta_create", lang)}</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
