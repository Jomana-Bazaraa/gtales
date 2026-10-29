import { SHOW_WHATS_INSIDE, WHATS_INSIDE } from "@/lib/gtales";

/** "What's inside every book" (fixnow A5): homepage + order page, only when NEXT_PUBLIC_SHOW_WHATS_INSIDE=1. */
export function WhatsInside({ className = "" }: { className?: string }) {
  if (!SHOW_WHATS_INSIDE) return null;
  return (
    <section aria-labelledby="whats-inside" className={`rounded-2xl bg-sky-soft p-4 md:p-5 flex flex-col gap-3 ${className}`}>
      <h2 id="whats-inside" className="m-0 text-[18px] leading-6 md:text-[22px] font-bold">What&apos;s inside every book</h2>
      <ul className="m-0 p-0 list-none flex flex-col gap-2">
        {WHATS_INSIDE.map((r) => (
          <li key={r.text} className="flex items-start gap-3 text-[15px] leading-[22px] font-semibold">
            <span aria-hidden className="shrink-0 w-8 h-8 rounded-xl bg-white grid place-items-center text-lg">{r.icon}</span>
            <span className="pt-1">{r.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
