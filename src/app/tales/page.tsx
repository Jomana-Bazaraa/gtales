import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Footer, Header } from "@/components/SiteChrome";
import { Promises } from "@/components/ui/Promises";
import { COPY, TALES } from "@/lib/gtales";

export const metadata: Metadata = {
  title: "Which superpower does your child need? — GTales",
  description: "Six tales, six superpowers. Every one has a free story, a colouring book and a parent guide.",
};

/** Catalogue — docs/SPEC.md §6. */
export default function TalesPage() {
  return (
    <>
      <Header />
      <main className="flex-1 w-full">
        <section className="bg-surface-tint">
          <div className="mx-auto max-w-6xl px-4 py-8 md:py-14 flex flex-col gap-3">
            <span className="eyebrow">Superpowers</span>
            <h1 className="text-[30px] leading-9 md:text-[44px] md:leading-[48px] font-bold text-balance">Which superpower does your child need right now?</h1>
            <p className="m-0 text-[16px] leading-6 md:text-lg text-ink-soft max-w-2xl">Every superpower has a free story and a parent guide. Pick one and your child's story is ready in two minutes.</p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 md:py-12 grid gap-4 md:grid-cols-3 md:gap-6">
          {TALES.map((t) => (
            <Link key={t.slug} href={`/tales/${t.slug}`} className="card overflow-hidden flex flex-row md:flex-col no-underline text-ink">
              {t.cover ? (
                <Image src={t.cover} alt={t.coverAlt} width={867} height={867} sizes="(max-width: 768px) 130px, 360px" className={`w-[130px] md:w-full object-cover shrink-0 ${t.portrait ? "aspect-[4/5] md:aspect-[4/5] object-top" : "aspect-square md:aspect-[4/3]"}`} />
              ) : (
                <div className="w-[130px] md:w-full aspect-square md:aspect-[4/3] shrink-0 grid place-items-center text-center p-3 text-[12px] font-bold text-ink-soft bg-surface-tint border-b-2 border-dashed border-line">IMAGE NEEDED: cover of the {t.title} tale</div>
              )}
              <div className="p-4 md:p-5 flex flex-col gap-1 flex-1 min-w-0">
                <h2 className="text-[20px] leading-6 md:text-[26px] md:leading-[30px] font-bold">{t.title}</h2>
                <span className="text-[13px] font-bold text-ink-soft">Helps with: {t.helps}</span>
                <p className="m-0 text-[15px] leading-[22px] hidden md:block">{t.line}</p>
                <span className="mt-auto pt-2 text-[15px] font-extrabold text-sky">Free story →</span>
              </div>
            </Link>
          ))}
        </section>

        <section className="bg-surface-tint">
          <div className="mx-auto max-w-6xl px-4 py-8 md:py-12 flex flex-col gap-4">
            <h2 className="text-[24px] leading-7 md:text-[32px] md:leading-9 font-bold">Five printed books with your child's face in every picture.</h2>
            <Promises variant="compact" className="md:grid md:grid-cols-2 md:gap-x-8" />
            <Link href="/order" className="btn-primary self-start">{COPY.ctaPrimary}</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
