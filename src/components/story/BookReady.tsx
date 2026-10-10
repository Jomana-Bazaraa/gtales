import Link from "next/link";
import { Footer, Header } from "@/components/SiteChrome";
import { SeriesBand } from "@/components/ui/SeriesBand";
import { BookActions } from "./BookActions";
import { taleBySlug } from "@/lib/gtales";
import type { BookRecord } from "@/lib/types";
import { storyImage } from "@/stories/images";

/** Ready screen for engine books — docs/SPEC.md §7. */
export function BookReady({ book, url }: { book: BookRecord; url: string }) {
  const name = book.child_name;
  const tale = taleBySlug(book.slug);
  return (
    <>
      <Header />
      <main className="flex-1 w-full">
        <section className="bg-surface-tint">
          <div className="mx-auto max-w-6xl px-4 py-8 md:py-12 grid md:grid-cols-[1fr_1.2fr] gap-6 md:gap-10 items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={storyImage(book.slug, book.gender, "cover.jpg")} alt={`The cover of ${book.title}`} className="w-[240px] md:w-[360px] mx-auto aspect-[5/7] object-cover rounded-r-2xl rounded-l-md shadow-[-6px_0_0_var(--ink),0_12px_0_var(--line)] bg-white" />
            <div className="flex flex-col gap-4">
              <span className="pill bg-mint-soft text-mint self-start">Free story · {tale?.title ?? "Superpower"}</span>
              <h1 className="text-[30px] leading-9 md:text-[44px] md:leading-[48px] font-bold text-balance">{name}'s story is ready</h1>
              <p className="m-0 text-[16px] leading-6 md:text-lg text-ink-soft">{book.title}. Read it together on the phone, or print the PDF. Keep this link: it is your way back to the story.</p>
              <BookActions book={book} url={url} />
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
                <li>Read it together, and let {name} answer every "Your turn" alone.</li>
                <li>Do the Combo with {name}, step by step, the first time.</li>
                <li>When it gets hard at home, say the Power Word first, then the Combo.</li>
              </ul>
            </div>
            <div className="card p-5 flex flex-col gap-2 border-2 border-dashed border-line !shadow-none">
              <b className="font-bold">Guide for the {tale?.title ?? ""} tale</b>
              <p className="m-0 text-[15px] leading-[22px] text-ink-soft">CONTENT NEEDED: the team's parent guide for this superpower goes here (what to say, what to try, what to notice).</p>
            </div>
          </div>
          <Link href="/tales?ref=share" className="text-[15px] font-extrabold text-sky">Another child at home? A free story for every superpower →</Link>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-10 md:pb-16">
          <SeriesBand childName={name} />
        </section>
      </main>
      <Footer />
    </>
  );
}
