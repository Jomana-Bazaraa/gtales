import { notFound, redirect } from "next/navigation";
import { Footer, Header } from "@/components/SiteChrome";
import { ReadyActions } from "@/components/story/ReadyActions";
import { SeriesBand } from "@/components/ui/SeriesBand";
import { getBook, getStory } from "@/lib/db";
import { BookReady } from "@/components/story/BookReady";
import { taleByKey } from "@/lib/gtales";
import { baseUrl } from "@/lib/site";
import { storyImage } from "@/stories/images";
import type { Metadata } from "next";

/** Link preview for WhatsApp / Facebook (LAUNCH-PLAN §3.9): the book's cover. Never the parent's details. */
export async function generateMetadata({ params }: PageProps<"/story/[id]">): Promise<Metadata> {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) return {};
  const title = `${book.title} · GTales`;
  const description = "A free picture book where the child is the hero. Make one for your child in two minutes.";
  const image = { url: storyImage(book.slug, book.gender, "cover.jpg"), alt: `The cover of ${book.title}` };
  return { title, description, openGraph: { title, description, type: "book", siteName: "GTales", images: [image] }, twitter: { card: "summary_large_image", title, description, images: [image.url] } };
}

/** Ready screen — docs/SPEC.md §7. */
export default async function StoryPage({ params }: PageProps<"/story/[id]">) {
  const { id } = await params;
  const book = await getBook(id);
  if (book) return <BookReady book={book} url={`${await baseUrl()}/story/${id}`} />;
  const story = await getStory(id);
  if (!story) notFound();
  if (story.status !== "ready" || !story.assembled) redirect(`/story/${id}/status`);
  const name = story.input.childName;
  const tale = taleByKey(story.input.struggle);
  const cover = story.cover_url ?? story.assembled.pages.find((p) => p.imageUrl)?.imageUrl ?? null;
  const tips = story.generated?.parent_tips ?? [];

  return (
    <>
      <Header />
      <main className="flex-1 w-full">
        <section className="bg-surface-tint">
          <div className="mx-auto max-w-6xl px-4 py-8 md:py-12 grid md:grid-cols-[1fr_1.2fr] gap-6 md:gap-10 items-center">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt={`The cover of ${story.assembled.title}`} className="w-[240px] md:w-[380px] mx-auto aspect-square object-cover rounded-r-2xl rounded-l-md shadow-[-6px_0_0_var(--ink),0_12px_0_var(--line)]" />
            ) : (
              <div className="w-[240px] md:w-[380px] mx-auto aspect-square grid place-items-center text-center p-4 text-[13px] font-bold text-ink-soft bg-white rounded-2xl border-2 border-dashed border-line">IMAGE NEEDED: cover</div>
            )}
            <div className="flex flex-col gap-4">
              <span className="pill bg-mint-soft text-mint self-start">Free story · {tale?.title ?? "Superpower"}</span>
              <h1 className="text-[30px] leading-9 md:text-[44px] md:leading-[48px] font-bold text-balance">{name}'s story is ready</h1>
              <p className="m-0 text-[16px] leading-6 md:text-lg text-ink-soft">{story.assembled.title}. Read it together on the phone. Keep this link: it is your way back to the story.</p>
              <ReadyActions story={story} />
            </div>
          </div>
        </section>

        <section id="guide" className="mx-auto max-w-6xl px-4 py-8 md:py-12 flex flex-col gap-4 scroll-mt-16">
          <span className="eyebrow">Parent guide</span>
          <h2 className="text-[24px] leading-7 md:text-[32px] md:leading-9 font-bold">A parent guide for this struggle</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="card p-5 flex flex-col gap-2">
              <b className="font-bold">How to read it with {name}</b>
              <ul className="m-0 ps-5 text-[15px] leading-[22px] text-ink-soft flex flex-col gap-1">
                <li>Read it together, and let {name} solve the "Your turn" page alone.</li>
                <li>When the hero changes, ask: "What helped?"</li>
                <li>Come back to the play pages another day. It doesn't have to be all at once.</li>
              </ul>
            </div>
            <div className="card p-5 flex flex-col gap-2">
              <b className="font-bold">Questions to talk about afterwards</b>
              <ol className="m-0 ps-5 text-[15px] leading-[22px] text-ink-soft flex flex-col gap-1">{tips.map((q, j) => <li key={j}>{q}</li>)}</ol>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-10 md:pb-16">
          <SeriesBand childName={name} />
        </section>
      </main>
      <Footer />
    </>
  );
}
