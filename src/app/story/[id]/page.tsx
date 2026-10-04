import { notFound, redirect } from "next/navigation";
import { Footer, Header } from "@/components/SiteChrome";
import { StoryBook } from "@/components/story/StoryBook";
import { StoryToolbar } from "@/components/story/StoryToolbar";
import { PhysicalOrderForm } from "@/components/story/PhysicalOrderForm";
import { getStory } from "@/lib/db";
import { t } from "@/lib/i18n";
import { LangProvider } from "@/lib/i18n-client";
import { baseUrl, PHYSICAL_BOOK_PRICE_EGP } from "@/lib/site";

export default async function StoryPage({ params }: PageProps<"/story/[id]">) {
  const { id } = await params;
  const story = await getStory(id);
  if (!story) notFound();
  if (story.status !== "ready" || !story.assembled) redirect(`/story/${id}/status`);
  const lang = story.input.language;
  const url = `${await baseUrl()}/story/${id}`;
  return (
    <LangProvider lang={lang}>
      <div dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1 mx-auto max-w-3xl px-4 py-6 w-full">
          {story.input.struggle === "other" && <p className="rounded-2xl bg-coral-soft text-coral-dark text-sm p-3 mb-4">{t("st_ai_notice", lang)}</p>}
          <StoryToolbar story={story} url={url} />
          <StoryBook story={story} mode="web" />
          <PhysicalOrderForm storyId={story.id} childName={story.input.childName} lang={lang} price={PHYSICAL_BOOK_PRICE_EGP} />
        </main>
        <Footer />
      </div>
    </LangProvider>
  );
}
