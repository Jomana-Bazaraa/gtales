import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer, Header } from "@/components/SiteChrome";
import { Icon, type IconName } from "@/components/ui/Icon";
import { SeriesBand } from "@/components/ui/SeriesBand";
import { COPY, TALES, taleBySlug } from "@/lib/gtales";

export function generateStaticParams() {
  return TALES.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/tales/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const t = taleBySlug(slug);
  if (!t) return {};
  return { title: `${t.title} — a free story for ${t.helps.toLowerCase()} — GTales`, description: t.line };
}

const INSIDE: { icon: IconName; title: string; copy: string }[] = [
  { icon: "book", title: "A 15-page story", copy: "Your child's name, their place, their people and their own brave words, in a ready-made tale." },
  { icon: "grid", title: "Your turn pages", copy: "Riddles, choices and brave steps the hero can't finish without your child." },
  { icon: "heart", title: "A parent guide for this struggle", copy: "What to say, what to try, and what to notice, for this one superpower." },
];

// Sample pages: real pages exist only for the Calm tale today (SPEC §2.5).
const SAMPLES = ["/book/page-4.jpg", "/book/your-turn.jpg", "/book/page-22.jpg"];

/** Superpower (struggle) page — docs/SPEC.md §6. */
export default async function TalePage({ params }: PageProps<"/tales/[slug]">) {
  const { slug } = await params;
  const t = taleBySlug(slug);
  if (!t) notFound();
  const hasArt = !!t.cover;
  return (
    <>
      <Header />
      <main className="flex-1 w-full">
        <section className="bg-surface-tint">
          <div className="mx-auto max-w-6xl px-4 py-8 md:py-14 grid md:grid-cols-[1.1fr_1fr] gap-6 md:gap-10 items-center">
            <div className="flex flex-col gap-3">
              <Link href="/tales" className="eyebrow no-underline">← All superpowers</Link>
              <h1 className="text-[34px] leading-[38px] md:text-[52px] md:leading-[56px] font-bold">{t.title}</h1>
              <p className="m-0 text-[16px] md:text-lg font-bold text-ink-soft">Helps with {t.helps.toLowerCase()}</p>
              <p className="m-0 text-[17px] leading-[26px] md:text-xl md:leading-8 max-w-xl">{t.line}</p>
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <Link href={`/create?tale=${t.slug}`} className="btn-secondary md:!h-14 md:!px-7 md:text-lg">{COPY.ctaSecondary}</Link>
                <Link href="/order" className="btn-ghost">{COPY.ctaPrimary}</Link>
              </div>
              <span className="text-[13px] font-bold text-ink-soft">Ages 4–8 · Ready in two minutes · No photo, no address</span>
            </div>
            {hasArt ? (
              <Image src={t.cover!} alt={t.coverAlt} width={867} height={867} priority sizes="(max-width: 768px) 80vw, 420px" className={`w-[260px] md:w-[360px] mx-auto object-cover rounded-r-2xl rounded-l-md shadow-[-6px_0_0_var(--ink),0_12px_0_var(--line)] ${t.portrait ? "aspect-[5/7]" : "aspect-square"}`} />
            ) : (
              <div className="w-[260px] md:w-[420px] mx-auto aspect-square grid place-items-center text-center p-4 text-[13px] font-bold text-ink-soft bg-white rounded-2xl border-2 border-dashed border-line">IMAGE NEEDED: cover of the {t.title} tale</div>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 md:py-12 flex flex-col gap-5">
          <h2 className="text-[24px] leading-7 md:text-[32px] md:leading-9 font-bold">What's inside the free story</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {INSIDE.map((f) => (
              <div key={f.title} className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-[0_3px_0_var(--line)]">
                <span className="shrink-0 w-10 h-10 rounded-xl bg-surface-tint grid place-items-center text-sky"><Icon name={f.icon} /></span>
                <span><b className="block font-bold">{f.title}</b><span className="block text-sm text-ink-soft font-medium">{f.copy}</span></span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            {(t.samples ?? SAMPLES.map((src, i) => ({ src, alt: ["A story page from the Calm tale", "A Your turn page from the Calm tale", "A story page from the Calm tale"][i] }))).map((s) =>
              hasArt ? (
                <Image key={s.src} src={s.src} alt={s.alt} width={867} height={867} sizes="(max-width: 768px) 30vw, 360px" className={`w-full object-cover rounded-2xl shadow-[0_3px_0_var(--line)] ${t.portrait ? "aspect-[5/4]" : "aspect-square"}`} />
              ) : (
                <div key={s.src} className="w-full aspect-square grid place-items-center text-center p-2 text-[11px] md:text-[13px] font-bold text-ink-soft bg-surface-tint rounded-2xl border-2 border-dashed border-line">IMAGE NEEDED: sample page from the {t.title} tale</div>
              ),
            )}
          </div>
          <Link href={`/create?tale=${t.slug}`} className="btn-secondary self-start">{COPY.ctaSecondary}</Link>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-10 md:pb-16">
          <SeriesBand />
        </section>
      </main>
      <Footer />
    </>
  );
}
