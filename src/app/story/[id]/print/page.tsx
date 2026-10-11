import { notFound } from "next/navigation";
import { BookPrint } from "@/components/story/BookPrint";
import { PrintBook } from "@/components/story/PrintBook";
import { getBook, getStory } from "@/lib/db";
import { showcaseStory } from "@/lib/showcase";
import { renderBookHtml } from "@/stories/render";

/** Print-only route used by the PDF renderer. Engine books use the team's template; old records keep theirs. */
export default async function PrintPage({ params, searchParams }: PageProps<"/story/[id]/print">) {
  const { id } = await params;
  const sp = await searchParams;
  const book = await getBook(id);
  if (book) return <BookPrint html={await renderBookHtml(book.story, book.form, "print")} />;
  const variant = sp.variant === "lineart" ? "lineart" : "color";
  const story = id === "showcase" ? await showcaseStory(sp.lang === "ar" ? "ar" : "en") : await getStory(id);
  if (!story || !story.assembled) notFound();
  return (
    <div className="bg-white">
      <style>{`@page { size: 200mm 200mm; margin: 0; } html, body { background: #fff; margin: 0; }`}</style>
      <PrintBook story={story} variant={variant} />
    </div>
  );
}
