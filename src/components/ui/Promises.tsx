import { PROMISES, type Promise_ } from "@/lib/gtales";
import { Icon, type IconName } from "./Icon";

const ICON: Record<Promise_["id"], IconName> = {
  review: "pencil",
  cod: "star",
  five: "book",
  crafted: "heart",
  play: "grid",
};

/**
 * The five promises (SPEC §1.2). `full` = five tiles with copy (landing pricing);
 * `compact` = five one-line rows (struggle page, ready screen, order review).
 * On phones the full variant becomes a horizontal swipe strip.
 */
export function Promises({ variant = "full", className = "" }: { variant?: "full" | "compact"; className?: string }) {
  if (variant === "compact") {
    return (
      <ul className={`flex flex-col gap-2 ${className}`}>
        {PROMISES.map((p) => (
          <li key={p.id} className="flex items-start gap-2.5 text-[15px] leading-[22px] font-semibold">
            <span className="shrink-0 mt-0.5 text-mint"><Icon name="check" size={20} strokeWidth={2.5} /></span>
            <span><b>{p.title}.</b> <span className="text-ink-soft font-medium">{shortCopy(p)}</span></span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className={`scroller md:grid md:grid-cols-5 md:gap-3 md:mx-0 md:px-0 md:pb-0 md:overflow-visible ${className}`}>
      {PROMISES.map((p) => (
        <div key={p.id} className="w-[240px] md:w-auto flex flex-col gap-2 rounded-2xl bg-surface-tint p-5">
          <span className="w-10 h-10 rounded-xl bg-white grid place-items-center text-flame"><Icon name={ICON[p.id]} /></span>
          <b className="display text-[17px] leading-[22px] font-bold">{p.title}</b>
          <span className="text-sm leading-5 text-ink-soft font-medium">{p.copy}</span>
        </div>
      ))}
    </div>
  );
}

function shortCopy(p: Promise_) {
  switch (p.id) {
    case "review": return "Every page comes to you on WhatsApp. Change anything before printing.";
    case "cod": return "Nothing to pay online. Pay the courier at your door.";
    case "five": return "Five printed books and one complete parent guide.";
    case "crafted": return "Their face, their people, their struggle, their dream adventure.";
    case "play": return "Riddles, mazes and choices only your child can solve.";
  }
}
