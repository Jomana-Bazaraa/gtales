"use client";
/**
 * Screen version of a GTales book. The HTML comes from the team's template renderer and
 * book.css is used untouched; this component only (1) scales the A4 pages to the phone,
 * (2) runs fitPages() once fonts are ready, (3) makes challenges tappable (handoff brief, step 3).
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { StoryJson } from "@/stories/schema";

const PAGE_W_PX = (210 / 25.4) * 96; // A4 width in CSS px

declare global {
  interface Window { GTales?: { fitPages: (root: Element) => void } }
}

export function BookView({ html, story, backHref, pdfHref, bookId }: { html: string; story: StoryJson; backHref: string; pdfHref: string; bookId: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  // scale to the viewport
  useEffect(() => {
    const f = () => setZoom(Math.min(1, (window.innerWidth - 16) / PAGE_W_PX));
    f(); window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);

  // fitPages after the template script and fonts are loaded
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!window.GTales) {
        await new Promise<void>((res) => { const s = document.createElement("script"); s.src = "/gtales-book/render.js"; s.onload = () => res(); s.onerror = () => res(); document.head.appendChild(s); });
      }
      await document.fonts.ready;
      await Promise.all(Array.from(root.current?.querySelectorAll("img") ?? []).filter((i) => !i.complete).map((i) => new Promise<void>((r) => { i.onload = () => r(); i.onerror = () => r(); })));
      if (!cancelled && root.current && window.GTales) window.GTales.fitPages(root.current);
    };
    run();
    return () => { cancelled = true; };
  }, [html]);

  // tappable challenges
  useEffect(() => {
    const el = root.current; if (!el) return;
    const pagesByNum = new Map(story.pages.map((p) => [String(p.n), p]));
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const page = t.closest(".gt-story-page") as HTMLElement | null; if (!page) return;
      const n = page.querySelector(".gt-num")?.textContent?.trim() ?? "";
      const p = pagesByNum.get(n); const ch = p?.challenge; if (!ch) return;
      const card = page.querySelector(".gt-card") as HTMLElement | null; if (!card) return;

      const choice = t.closest(".gt-choice") as HTMLElement | null;
      if (choice && ch.options) {
        const all = Array.from(card.querySelectorAll(".gt-choice"));
        const k = all.indexOf(choice); const o = ch.options[k]; if (!o) return;
        all.forEach((c) => c.classList.remove("gt-on", "gt-ok", "gt-no"));
        choice.classList.add("gt-on", o.correct ? "gt-ok" : "gt-no");
        bubble(card, o.response || (o.correct ? "Yes!" : "Try again."), o.correct);
        if (o.correct) { beacon("challenge_completed", bookId, p!.n); ding(); }
        return;
      }
      const step = t.closest(".gt-steps li") as HTMLElement | null;
      if (step) {
        step.classList.toggle("gt-on");
        const li = Array.from(card.querySelectorAll(".gt-steps li"));
        if (li.every((x) => x.classList.contains("gt-on"))) { bubble(card, ch.done ?? "Well done!", true); beacon("challenge_completed", bookId, p!.n); ding(); }
        return;
      }
      const box = t.closest(".gt-boxes i") as HTMLElement | null;
      if (box) {
        box.classList.toggle("gt-on");
        const bs = Array.from(card.querySelectorAll(".gt-boxes i"));
        if (bs.every((x) => x.classList.contains("gt-on"))) { bubble(card, ch.done ?? "Well done!", true); beacon("challenge_completed", bookId, p!.n); ding(); }
      }
    };
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, [story, bookId]);

  useEffect(() => { beacon("story_opened", bookId); }, [bookId]);
  // story_finished when the back cover comes into view
  useEffect(() => {
    const pages = root.current?.querySelectorAll(".gt-page"); const last = pages?.[pages.length - 1]; if (!last) return;
    let sent = false;
    const io = new IntersectionObserver((es) => { if (!sent && es.some((e) => e.isIntersecting)) { sent = true; beacon("story_finished", bookId); io.disconnect(); } }, { threshold: 0.5 });
    io.observe(last); return () => io.disconnect();
  }, [html, bookId]);

  return (
    <div className="min-h-dvh bg-[#ddd]">
      <link rel="stylesheet" href="/gtales-book/book.css" />
      <style>{`
        .gt-choice, .gt-steps li, .gt-boxes i { cursor: pointer; }
        .gt-choice.gt-ok { border-color: #2a8a5b; background: #e9f7ef; }
        .gt-choice.gt-ok::before { background: #2a8a5b; border-color: #2a8a5b; }
        .gt-choice.gt-no { border-color: #c8513a; background: #fdeeea; }
        .gt-choice.gt-no::before { background: #c8513a; border-color: #c8513a; }
        .gt-steps li.gt-on::before, .gt-boxes i.gt-on { background: #2a8a5b; border-color: #2a8a5b; }
        .gt-bubble { margin-top: 2.5mm; padding: 2mm 3.5mm; border-radius: 3mm; font: 500 11pt/1.35 Fredoka, sans-serif; background: #f2f2f2; color: #22212e; }
        .gt-bubble.gt-ok { background: #fff3cc; }
        .gt-view { zoom: ${zoom}; padding: 6mm 0 24mm; }
      `}</style>
      <header className="sticky top-0 z-20 flex items-center gap-2 px-3 py-2 bg-white/95 backdrop-blur border-b border-line">
        <Link href={backHref} aria-label="Close the story" className="w-10 h-10 rounded-full grid place-items-center bg-surface-tint text-ink no-underline">✕</Link>
        <span className="flex-1 text-center display font-bold text-[15px] leading-5 truncate">{story.title}</span>
        <a href={pdfHref} target="_blank" rel="noreferrer" className="btn-ghost !h-9 !px-3 text-sm">PDF</a>
      </header>
      <div ref={root} className="gt-book gt-view" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

function bubble(card: HTMLElement, text: string, ok: boolean) {
  let b = card.querySelector(".gt-bubble") as HTMLElement | null;
  if (!b) { b = document.createElement("div"); card.appendChild(b); }
  b.className = `gt-bubble ${ok ? "gt-ok" : ""}`;
  b.textContent = (ok ? "★ " : "") + text;
}
function ding() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(660, ctx.currentTime); o.frequency.setValueAtTime(990, ctx.currentTime + 0.12);
    g.gain.setValueAtTime(0.15, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.4);
  } catch {}
}
function beacon(event: string, storyId: string, page?: number) {
  try { navigator.sendBeacon?.("/api/events", new Blob([JSON.stringify({ event, story_id: storyId, page })], { type: "application/json" })); } catch {}
}
