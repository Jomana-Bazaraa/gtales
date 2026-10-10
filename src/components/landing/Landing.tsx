import Image from "next/image";
import Link from "next/link";
import { COPY, TALES, egp } from "@/lib/gtales";
import { currentBreakdown } from "@/lib/pricing";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Promises } from "@/components/ui/Promises";

/* ============ 1. Hero ============ */
export function Hero() {
  return (
    <section className="bg-surface-tint">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-16 grid md:grid-cols-[1.05fr_1fr] gap-8 md:gap-10 items-center">
        <div className="flex flex-col gap-5 md:gap-6">
          <span className="eyebrow">{COPY.slogan}</span>
          <h1 className="text-[34px] leading-[38px] md:text-[52px] md:leading-[56px] font-bold text-balance">
            A personalised storybook where your child is the hero.
          </h1>
          <p className="text-[17px] leading-[26px] md:text-xl md:leading-8 text-ink-soft max-w-xl">
            The only story where they see their own name, and their own face, on every page. Each tale unlocks a superpower.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/order" className="btn-primary md:!h-14 md:!px-7 md:text-lg">{COPY.ctaPrimary}</Link>
            <Link href="/tales" className="btn-secondary">{COPY.ctaSecondary}</Link>
          </div>
          <p className="text-[13px] md:text-sm font-bold text-ink-soft flex flex-wrap gap-x-2">
            {COPY.trustLine.map((t, i) => (
              <span key={t}>{i > 0 && <span className="mr-2">·</span>}{t}</span>
            ))}
          </p>
        </div>
        <FannedBooks />
      </div>
    </section>
  );
}

function FannedBooks() {
  const books = [
    { src: "/meet/page-7.jpg", alt: "A story page: Adam hides behind the water tank and meets a friendly dog", cls: "-rotate-6 translate-x-10 -translate-y-3 md:translate-x-20 md:-translate-y-4" },
    { src: "/meet/page-12.jpg", alt: "A Your turn page: Adam sits on the stairs and does the brave steps", cls: "rotate-6 -translate-x-10 -translate-y-3 md:-translate-x-20 md:-translate-y-4" },
    { src: "/meet/cover.jpg", alt: "The cover: Adam and the Big Shadow", cls: "z-10" },
  ];
  return (
    <div className="relative h-[280px] md:h-[440px] flex items-center justify-center">
      {books.map((b, i) => (
        <Image
          key={b.src}
          src={b.src}
          alt={b.alt}
          width={693}
          height={980}
          priority={i === 2}
          sizes="(max-width: 768px) 60vw, 360px"
          className={`absolute w-[170px] md:w-[270px] aspect-[1/1.414] object-cover rounded-r-2xl rounded-l-md shadow-[-6px_0_0_var(--ink),0_12px_0_var(--line)] ${b.cls}`}
        />
      ))}
    </div>
  );
}

/* ============ 2. How it works ============ */
const STEPS: { icon: IconName; tint: string; color: string; time: string; title: string; copy: string }[] = [
  { icon: "person", tint: "bg-flame-soft", color: "text-flame-deep", time: "10 minutes", title: "Tell us about your child", copy: "Name, photo, their people, what's hard right now." },
  { icon: "book", tint: "bg-sky-soft", color: "text-sky", time: "5 days", title: "We create their story", copy: "Three tales with their face in every picture." },
  { icon: "pencil", tint: "bg-sun-soft", color: "text-cta-shadow", time: "Until it's perfect", title: "You approve every page", copy: "On WhatsApp. Change anything you like." },
  { icon: "home", tint: "bg-mint-soft", color: "text-mint", time: "5 days after approval", title: "Delivered to your door", copy: "Three printed books. Pay the courier." },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-16">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-16 flex flex-col gap-8 md:gap-10">
        <div className="text-center flex flex-col items-center gap-2">
          <span className="eyebrow">How it works</span>
          <h2 className="text-[28px] leading-8 md:text-[38px] md:leading-[42px] font-bold">Four steps to three printed books</h2>
        </div>
        <ol className="relative grid gap-5 md:grid-cols-4 md:gap-6">
          <span aria-hidden className="hidden md:block absolute left-[12.5%] right-[12.5%] top-9 border-t-[3px] border-dashed border-line" />
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative flex md:flex-col items-center md:text-center gap-4 md:gap-3">
              <span className={`relative shrink-0 w-14 h-14 md:w-[72px] md:h-[72px] rounded-2xl md:rounded-3xl grid place-items-center ${s.tint} ${s.color} shadow-[0_4px_0_rgba(30,27,75,.12)]`}>
                <Icon name={s.icon} size={30} />
                <i className="absolute -right-2 -top-2 w-6 h-6 rounded-full bg-ink text-white text-[12px] leading-6 text-center font-extrabold not-italic border-[3px] border-white box-content">{i + 1}</i>
              </span>
              <span className="flex flex-col md:items-center gap-1 md:gap-2">
                <span className="pill bg-sky-soft text-sky self-start md:self-center">{s.time}</span>
                <b className="display text-lg md:text-xl font-bold leading-tight">{s.title}</b>
                <span className="text-[15px] leading-[22px] text-ink-soft">{s.copy}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ============ 3. Meet the book ============ */
const PAGES = [
  { src: "/meet/cover.jpg", alt: "The cover: Adam and the Big Shadow" },
  { src: "/meet/page-1.jpg", alt: "Page 1: bedtime in Maadi, the power goes off and a big shadow appears on the wall" },
  { src: "/meet/your-turn.jpg", alt: "A Your turn page: help Adam read the riddle" },
  { src: "/meet/back.jpg", alt: "The back cover: can Adam make his worry cloud small enough to be brave?" },
];
const FEATURES: { icon: IconName; title: string; copy: string }[] = [
  { icon: "person", title: "The hero", copy: "Adam, 6, in every picture" },
  { icon: "bolt", title: "The superpower", copy: "Courage: a worry cloud that shrinks with a brave heart" },
  { icon: "blocks", title: "Their world", copy: "His rooftop in Maadi, his Power Word, his sidekick Bolt" },
  { icon: "people", title: "Their people", copy: "His brother Omar, Mama and Baba" },
  { icon: "grid", title: "Your turn pages", copy: "Riddles, choices and steps only Adam can do" },
  { icon: "book", title: "A real book", copy: "A4 pages, 15 story pages plus cover and back" },
];

export function MeetTheBook() {
  return (
    <section id="book" className="bg-surface-tint scroll-mt-16">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-16 flex flex-col gap-6 md:gap-7">
        <div className="flex flex-col gap-2">
          <span className="eyebrow">Meet the book</span>
          <h2 className="text-[28px] leading-8 md:text-[38px] md:leading-[42px] font-bold">Adam, 6, Maadi. His superpower: Courage.</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {PAGES.map((p) => (
            <Image key={p.src} src={p.src} alt={p.alt} width={693} height={980} sizes="(max-width: 768px) 45vw, 270px" className="w-full aspect-[1/1.414] object-cover rounded-2xl shadow-[0_4px_0_var(--line)]" />
          ))}
        </div>
        <p className="md:hidden m-0 text-[15px] leading-[22px] text-ink-soft">
          Adam is in every picture, with Omar, Mama and Baba. His rooftop in Maadi, his Power Word, and Your turn pages only he can solve.
        </p>
        <div className="hidden md:grid grid-cols-3 gap-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-[0_3px_0_var(--line)]">
              <span className="shrink-0 w-10 h-10 rounded-xl bg-surface-tint grid place-items-center text-sky"><Icon name={f.icon} /></span>
              <span><b className="block font-bold">{f.title}</b><span className="block text-sm text-ink-soft font-medium">{f.copy}</span></span>
            </div>
          ))}
        </div>
        <Link href="/tales/anxiety" className="btn-secondary self-start">See the Courage tale</Link>
      </div>
    </section>
  );
}

/* ============ 4. Six superpowers ============ */
export function Superpowers() {
  return (
    <section id="powers" className="bg-night text-white scroll-mt-16">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-20 flex flex-col gap-6 md:gap-8">
        <div className="text-center flex flex-col items-center gap-2">
          <h2 className="text-[32px] leading-9 md:text-[44px] md:leading-[48px] font-bold">Six tales. Six superpowers.</h2>
          <p className="m-0 text-base md:text-lg text-[#b9b5d9] max-w-[560px]">Every tale helps your child grow one strength. Pick the three that matter most.</p>
        </div>
        <div className="scroller md:grid md:grid-cols-3 md:gap-6 md:mx-0 md:px-0 md:pb-0 md:overflow-visible text-ink">
          {TALES.map((t) => (
            <Link key={t.slug} href={`/tales/${t.slug}`} className="w-[160px] md:w-auto flex flex-col rounded-2xl md:rounded-[28px] bg-white overflow-hidden shadow-[0_3px_0_var(--line)] no-underline text-ink">
              {t.cover ? (
                <Image src={t.cover} alt={t.coverAlt} width={693} height={980} sizes="(max-width: 768px) 160px, 360px" className={`w-full object-cover ${t.portrait ? "aspect-[4/5] object-top" : "aspect-[4/3]"}`} />
              ) : (
                <div className="w-full aspect-[4/3] grid place-items-center text-center p-3 text-[12px] md:text-[13px] font-bold text-ink-soft bg-surface-tint border-b-2 border-dashed border-line">
                  IMAGE NEEDED: cover of the {t.title} tale
                </div>
              )}
              <div className="p-3 md:p-5 flex flex-col gap-1 flex-1">
                <h3 className="text-lg md:text-[26px] md:leading-[30px] font-bold">{t.title}</h3>
                <span className="text-[12px] md:text-[13px] font-bold text-ink-soft">Helps with: {t.helps}</span>
                <p className="hidden md:block m-0 text-[15px] leading-[22px]">{t.line}</p>
                <span className="mt-auto pt-2 text-sm md:text-[15px] font-extrabold text-sky">Free story →</span>
              </div>
            </Link>
          ))}
        </div>
        <p className="m-0 text-center text-[#b9b5d9] text-sm md:text-[15px]">Ages 2–10. New superpowers are added every month.</p>
      </div>
    </section>
  );
}

/* ============ 5. Pricing: tier cards + promises ============ */
function Row({ ok, children, className = "" }: { ok: boolean; children: React.ReactNode; className?: string }) {
  return (
    <span className={`${className} flex items-start gap-2.5 text-[15px] leading-[22px] font-semibold ${ok ? "" : "text-ink-soft"}`}>
      <span className={`shrink-0 mt-0.5 ${ok ? "text-mint" : "text-danger"}`}><Icon name={ok ? "check" : "cross"} size={20} strokeWidth={3} /></span>
      {children}
    </span>
  );
}

export async function Pricing() {
  const p = await currentBreakdown();
  return (
    <section id="pricing" className="scroll-mt-16">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-16 flex flex-col gap-6 md:gap-8">
        <div className="text-center flex flex-col items-center gap-2">
          <span className="eyebrow">Pricing</span>
          <h2 className="text-[28px] leading-8 md:text-[38px] md:leading-[42px] font-bold">Start free. Keep the printed books forever.</h2>
        </div>

        <div className="grid md:grid-cols-[1fr_1.5fr] gap-4 md:gap-5 items-stretch">
          {/* The Series first on phones (Series-first positioning), second on desktop */}
          <div className="relative order-1 md:order-2 flex flex-col gap-3 rounded-[24px] md:rounded-[28px] bg-white border-[3px] border-flame p-5 md:p-7 shadow-[0_3px_0_var(--line)]">
            <span className="pill bg-sun text-ink absolute -top-3.5 left-5 md:left-7">The Series · printed · most loved</span>
            <h3 className="mt-2 text-[22px] leading-[26px] md:text-[28px] md:leading-8 font-bold">Three printed books + a complete parent guide</h3>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-ink-soft line-through text-lg md:text-xl">{egp(p.listPrice)}</span>
              <span className="display text-[32px] md:text-[40px] font-bold leading-none">{egp(p.net)}</span>
              <span className="pill bg-sun text-ink">{p.promoCode}</span>
            </div>
            <span className="text-sm font-bold text-ink-soft -mt-1">+ {egp(p.delivery)} delivery · pay on delivery</span>
            <div className="grid md:grid-cols-2 gap-2 md:gap-x-4">
              <Row ok>Their face in every picture, from your photo</Row>
              <Row ok className="hidden md:flex">The people they love, with their faces</Row>
              <Row ok>Written from scratch around their strengths and struggles</Row>
              <Row ok className="hidden md:flex">A family memory turned into a story</Row>
              <Row ok className="hidden md:flex">Interactive pages they play through</Row>
              <Row ok>Three printed books, delivered to your door</Row>
              <Row ok className="hidden md:flex">One complete parent guide for all three</Row>
              <Row ok>You approve every page on WhatsApp, unlimited changes</Row>
            </div>
            <div className="mt-auto pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
              <Link href="/order" className="btn-primary md:!h-14 md:!px-7 md:text-lg">{COPY.ctaPrimary}</Link>
              <span className="text-sm font-bold text-ink-soft text-center">You approve every page before we print</span>
            </div>
          </div>

          <div className="order-2 md:order-1 flex flex-col gap-3 rounded-[24px] md:rounded-[28px] bg-surface-tint p-5 md:p-7">
            <span className="eyebrow !text-ink-soft">Free story</span>
            <h3 className="text-[20px] leading-6 md:text-2xl font-bold">A taste, in two minutes</h3>
            <span className="display text-[28px] font-bold leading-none">Free</span>
            <div className="flex flex-col gap-2">
              <Row ok>Your child's name, interests and home words</Row>
              <Row ok>Interactive pages: riddles and choices</Row>
              <Row ok>1 digital story PDF + parent guide</Row>
              <Row ok={false}>Standard pictures, not your child's face</Row>
              <Row ok={false}>A ready-made tale, not written for them</Row>
              <Row ok={false}>Digital only, nothing printed</Row>
            </div>
            <Link href="/tales" className="btn-ghost self-start mt-auto">{COPY.ctaSecondary}</Link>
          </div>
        </div>

        <Promises />
      </div>
    </section>
  );
}

/* ============ 7. FAQ + final CTA ============ */
const FAQ = [
  ["How do you make the pictures?", "We create the illustrations from your photo, and our team checks every page. You review them all before anything is printed."],
  ["What if I don't like something?", "You approve every page before printing, and you pay only on delivery. Nothing is printed until you say it's perfect."],
  ["Is the free story the same book?", "No. The free story is a taste: your child's name, interests and family words in a ready-made tale. The Series is built from scratch around your child, with their face, the people they love, their strengths and struggles, and a memory you want to create together."],
  ["When do I pay?", "Only when the courier hands you the books. Cash or card at the door. Nothing online."],
  ["What happens to the photo?", "It is used only to create the pictures, stored privately, and deleted automatically once the books are delivered."],
];

export function Faq() {
  return (
    <section id="faq" className="bg-surface-tint scroll-mt-16">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-16 grid md:grid-cols-[1fr_2fr] gap-6 md:gap-8">
        <div className="flex flex-col gap-2">
          <span className="eyebrow">FAQ</span>
          <h2 className="text-[28px] leading-8 md:text-[38px] md:leading-[42px] font-bold">Questions parents ask</h2>
        </div>
        <div className="flex flex-col">
          {FAQ.map(([q, a], i) => (
            <details key={q} open={i === 0} className="group border-t border-line py-3 md:py-4">
              <summary className="list-none cursor-pointer flex items-center justify-between gap-3 font-bold text-[16px] md:text-[17px]">
                {q}
                <span className="shrink-0 text-sky transition group-open:rotate-180"><Icon name="chevron" size={20} strokeWidth={2.5} /></span>
              </summary>
              <p className="m-0 mt-2 text-[15px] leading-[22px] text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="bg-sky text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-16 flex flex-col items-center text-center gap-5">
        <h2 className="text-[30px] leading-9 md:text-[40px] md:leading-[44px] font-bold">Ready to make your child the hero?</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link href="/order" className="btn-primary md:!h-14 md:!px-7 md:text-lg">{COPY.ctaPrimary}</Link>
          <Link href="/tales" className="btn-ghost !border-white/40">{COPY.ctaSecondary}</Link>
        </div>
      </div>
    </section>
  );
}
