"use client";
import { useEffect, useRef, useState } from "react";

/**
 * "[number] stories · created by Egyptian kids ✨" (U7), right before Pricing. Number from /api/stats/public
 * (free stories + books ordered, all time). Rolls up from 0 in ~1.5 s when it comes into view; with
 * prefers-reduced-motion it shows the final number. Hidden if the number can't be loaded or is 0.
 */
export function StoriesCounter() {
  const [total, setTotal] = useState<number | null>(null);
  const [shown, setShown] = useState(0);
  const box = useRef<HTMLElement>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/stats/public").then((r) => (r.ok ? r.json() : null)).then((j) => { if (alive && j && Number.isFinite(j.totalStories) && j.totalStories > 0) setTotal(Math.floor(j.totalStories)); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const el = box.current; if (!total || !el) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches; // then: the final number, no rolling
    let raf = 0;
    const io = new IntersectionObserver((es) => {
      if (!es.some((e) => e.isIntersecting)) return;
      io.disconnect();
      if (still) { setShown(total); return; }
      const t0 = performance.now();
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / 1500);
        setShown(Math.round(total * (1 - Math.pow(1 - k, 3)))); // ease-out
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [total]);

  if (!total) return null;
  const digits = String(shown).padStart(String(total).length, "0").split("");
  return (
    <section ref={box} aria-label={`${total.toLocaleString("en-US")} stories created by Egyptian kids`} className="mx-auto max-w-6xl px-4 pt-8 md:pt-14 flex flex-col items-center gap-3 text-center">
      <div aria-hidden className="flex items-end justify-center flex-wrap gap-x-3 gap-y-2">
        <span className="flex gap-1.5 md:gap-2">
          {digits.map((d, k) => (
            <span key={k} className="w-[46px] h-[64px] md:w-[64px] md:h-[88px] rounded-2xl md:rounded-3xl bg-teal-soft text-teal display font-bold text-[44px] md:text-[64px] leading-none grid place-items-center tabular-nums shadow-[0_3px_0_var(--line)]">{d}</span>
          ))}
        </span>
        <span className="display font-bold text-[34px] md:text-[48px] leading-none text-teal pb-2">stories</span>
      </div>
      <p aria-hidden className="m-0 text-[16px] md:text-lg font-bold text-ink-soft">created by Egyptian kids ✨</p>
    </section>
  );
}
