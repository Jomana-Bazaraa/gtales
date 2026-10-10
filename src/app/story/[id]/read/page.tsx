import { notFound, redirect } from "next/navigation";
import "@fontsource/andika/400.css";
import "@fontsource/andika/700.css";
import { BookReader } from "@/components/story/BookReader";
import { Reader } from "@/components/story/Reader";
import { getBook, getStory } from "@/lib/db";

/** Book view — docs/SPEC.md §8. No site chrome: the page is the book. */
export default async function ReadPage({ params }: PageProps<"/story/[id]/read">) {
  const { id } = await params;
  const book = await getBook(id);
  if (book) return <BookReader book={book} backHref={`/story/${id}`} />;
  const story = await getStory(id);
  if (!story) notFound();
  if (story.status !== "ready" || !story.assembled) redirect(`/story/${id}/status`);
  return <Reader story={story} backHref={`/story/${id}`} />;
}
