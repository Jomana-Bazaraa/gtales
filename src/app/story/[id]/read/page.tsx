import { notFound, redirect } from "next/navigation";
import "@fontsource/andika/400.css";
import "@fontsource/andika/700.css";
import { BookView } from "@/components/story/BookView";
import { Reader } from "@/components/story/Reader";
import { getBook, getStory } from "@/lib/db";
import { renderBookHtml } from "@/stories/render";

/** Book view. Engine books: the team's template, scaled to the phone, challenges tappable. */
export default async function ReadPage({ params }: PageProps<"/story/[id]/read">) {
  const { id } = await params;
  const book = await getBook(id);
  if (book) return <BookView html={await renderBookHtml(book.story, book.form)} story={book.story} backHref={`/story/${id}`} pdfHref={`/api/books/${id}/pdf`} bookId={id} hasEmail={(book.contact ?? "").includes("@")} />;
  const story = await getStory(id);
  if (!story) notFound();
  if (story.status !== "ready" || !story.assembled) redirect(`/story/${id}/status`);
  return <Reader story={story} backHref={`/story/${id}`} />;
}
