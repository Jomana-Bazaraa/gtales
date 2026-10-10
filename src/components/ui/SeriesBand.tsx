import Link from "next/link";
import { COPY, egp } from "@/lib/gtales";
import { currentBreakdown } from "@/lib/pricing";
import { Icon, type IconName } from "./Icon";
import { Promises } from "./Promises";

const ROWS: { icon: IconName; text: string }[] = [
  { icon: "person", text: "Their face and the people they love in every picture" },
  { icon: "bolt", text: "A story built around their strengths, not just their name" },
  { icon: "heart", text: "A memory you create together, turned into a tale" },
  { icon: "book", text: "Three books plus a complete parent guide" },
];

/**
 * "Make it truly theirs" — the route from free to paid (SPEC §6 struggle page, §7 ready screen).
 * Four icon rows, price, compact promises, one button.
 */
export async function SeriesBand({ childName, className = "", href = "/order" }: { childName?: string; className?: string; href?: string }) {
  const p = await currentBreakdown();
  return (
    <section className={`rounded-[24px] md:rounded-[28px] bg-white border-[3px] border-flame p-5 md:p-7 flex flex-col gap-4 shadow-[0_3px_0_var(--line)] ${className}`}>
      <div className="flex flex-col gap-1">
        <span className="pill bg-sun text-ink self-start">The Series · printed</span>
        <h2 className="text-[24px] leading-7 md:text-[30px] md:leading-9 font-bold mt-1">Make it truly {childName ? `${childName}'s` : "theirs"}</h2>
      </div>
      <ul className="flex flex-col gap-2.5 m-0 p-0 list-none">
        {ROWS.map((r) => (
          <li key={r.text} className="flex items-start gap-3 text-[15px] leading-[22px] font-semibold">
            <span className="shrink-0 w-9 h-9 rounded-xl bg-flame-soft text-flame-deep grid place-items-center"><Icon name={r.icon} size={20} /></span>
            <span className="pt-1.5">{r.text}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-ink-soft line-through text-base">{egp(p.listPrice)}</span>
        <span className="display text-[28px] md:text-[32px] font-bold leading-none">{egp(p.net)}</span>
        <span className="pill bg-sun text-ink">{p.promoCode}</span>
        <span className="text-sm font-bold text-ink-soft">+ {egp(p.delivery)} delivery · pay on delivery</span>
      </div>
      <Promises variant="compact" />
      <Link href={href} className="btn-primary w-full md:w-auto md:self-start md:!h-14 md:!px-7 md:text-lg">{COPY.ctaPrimary}</Link>
    </section>
  );
}
