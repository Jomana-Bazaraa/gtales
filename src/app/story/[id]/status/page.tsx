import { notFound, redirect } from "next/navigation";
import { Footer, Header } from "@/components/SiteChrome";
import { StatusPoller } from "@/components/story/StatusPoller";
import { getStory } from "@/lib/db";
import { LangProvider } from "@/lib/i18n-client";

export default async function StatusPage({ params }: PageProps<"/story/[id]/status">) {
  const { id } = await params;
  const story = await getStory(id);
  if (!story) notFound();
  if (story.status === "ready") redirect(`/story/${id}`);
  const lang = story.input.language;
  return (
    <LangProvider lang={lang}>
      <div dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1 mx-auto max-w-lg px-4 py-16 w-full text-center">
          <StatusPoller id={id} childName={story.input.childName} initialStatus={story.status} initialProgress={story.progress} />
        </main>
        <Footer />
      </div>
    </LangProvider>
  );
}
