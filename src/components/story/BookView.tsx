"use client";
import { track } from "@/lib/track";
/**
 * Screen version of a GTales book. The HTML comes from the team's template renderer and
 * book.css is used untouched; this component only (1) scales the A4 pages to the phone,
 * (2) runs fitPages() once fonts are ready, (3) makes challenges tappable (handoff brief, step 3),
 * (4) "Read to me" with the phone's own voice (Web Speech API: free, no AI), word by word (SPEC §15).
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { EmailMe } from "./EmailMe";
import type { StoryJson } from "@/stories/schema";

const PAGE_W_PX = (210 / 25.4) * 96; // A4 width in CSS px

declare global {
  interface Window { GTales?: { fitPages: (root: Element) => void } }
}

export function BookView({ html, story, backHref, pdfHref, bookId }: { html: string; story: StoryJson; backHref: string; pdfHref: string; bookId: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  // scale to the reader's width. Not innerWidth: on phones the unscaled A4 page first widens the layout
  // viewport (innerWidth 778 on a 390 px phone), so the book stayed full size and was cut off.
  useEffect(() => {
    const f = () => setZoom(Math.min(1, ((root.current?.parentElement?.clientWidth ?? window.innerWidth) - 16) / PAGE_W_PX));
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

  // Read to me: from the page in view to the next "Your turn" (the child answers, then taps again)
  const [canSpeak, setCanSpeak] = useState(false);
  const [reading, setReading] = useState(false);
  const run = useRef(0); // bumped on stop, so a cancelled queue never continues
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setCanSpeak("speechSynthesis" in window); return () => { run.current++; window.speechSynthesis?.cancel(); }; }, []);
  const stopReading = () => { run.current++; window.speechSynthesis.cancel(); clearMarks(root.current); setReading(false); };
  const readToMe = () => {
    if (reading) return stopReading();
    const el = root.current; if (!el) return;
    const pages = Array.from(el.querySelectorAll<HTMLElement>(".gt-page"));
    const from = Math.max(0, pages.findIndex((pg) => pg.getBoundingClientRect().bottom > window.innerHeight * 0.35));
    const queue: HTMLElement[] = [];
    for (const pg of pages.slice(from)) {
      queue.push(...pg.querySelectorAll<HTMLElement>(".gt-title h1, .gt-story p, .gt-card .gt-q, .gt-riddle, .gt-choice, .gt-steps li"));
      if (pg.querySelector(".gt-card")) break;
    }
    if (!queue.length) return;
    const synth = window.speechSynthesis;
    const voice = pickVoice(synth);
    const me = ++run.current;
    setReading(true);
    beacon("audio_played", bookId, Number(pages[from].querySelector(".gt-num")?.textContent) || 0);
    const say = (k: number) => {
      if (me !== run.current) return;
      clearMarks(el);
      if (k >= queue.length) { setReading(false); return; }
      const part = queue[k];
      const spans = wrapWords(part);
      part.classList.add("gt-reading");
      const pg = part.closest(".gt-page");
      if (pg && (k === 0 || pg !== queue[k - 1].closest(".gt-page"))) window.scrollTo({ top: window.scrollY + pg.getBoundingClientRect().top - 64, behavior: "smooth" }); // 64: below the sticky top bar
      // emoji become spaces of the same length, so word positions still match the highlighted spans
      const u = new SpeechSynthesisUtterance((part.textContent ?? "").replace(/\p{Extended_Pictographic}|\uFE0F|\u200D/gu, (m) => " ".repeat(m.length)));
      if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = "en-GB";
      u.rate = 0.9;
      u.onboundary = (e) => { if (e.name && e.name !== "word") return; spans.forEach((sp) => sp.classList.toggle("gt-say", Number(sp.dataset.a) <= e.charIndex && e.charIndex < Number(sp.dataset.b))); };
      u.onend = () => say(k + 1);
      u.onerror = (e) => { if (e.error !== "interrupted" && e.error !== "canceled") say(k + 1); };
      synth.speak(u);
    };
    synth.cancel();
    say(0);
  };

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
        .gt-reading { background: rgba(255, 214, 102, .22); border-radius: 1.5mm; }
        .gt-say { background: #ffd666; border-radius: 1mm; }
      `}</style>
      <header className="sticky top-0 z-20 flex items-center gap-2 px-3 py-2 bg-white/95 backdrop-blur border-b border-line">
        <Link href={backHref} aria-label="Close the story" className="w-10 h-10 rounded-full grid place-items-center bg-surface-tint text-ink no-underline">✕</Link>
        <span className="flex-1 text-center display font-bold text-[15px] leading-5 truncate">{story.title}</span>
        {canSpeak && <button type="button" onClick={readToMe} aria-label={reading ? "Stop reading" : "Read to me"} aria-pressed={reading} className={`w-10 h-10 rounded-full grid place-items-center text-ink ${reading ? "bg-sun" : "bg-cta shadow-[0_3px_0_var(--cta-shadow)]"}`}><Icon name="speaker" size={20} strokeWidth={2.5} /></button>}
        <a href={pdfHref} target="_blank" rel="noreferrer" className="btn-ghost !h-9 !px-3 text-sm">PDF</a>
      </header>
      {/* overflow-x: clip keeps the A4 pages from widening the page before they are scaled (and keeps the header sticky) */}
      <div style={{ overflowX: "clip" }}>
        <div ref={root} className="gt-book gt-view" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      {/* end of the story: no review prompt here (Jomana, 24 Oct) */}
      <div className="mx-auto max-w-md px-4 pb-16 -mt-8 flex flex-col gap-3 text-center">
        <div className="text-left"><EmailMe bookId={bookId} /></div>
        <Link href={`/order?story=${bookId}`} onClick={() => beacon("series_cta_clicked", bookId)} className="btn-secondary self-center">Make it a real printed book →</Link>
        <Link href={backHref} className="text-[15px] font-extrabold text-sky">Story page: PDF, parent guide, share</Link>
      </div>
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
  track(event, { story_id: storyId, page });
}

/** An English voice on this device, preferring a local British or American one. */
function pickVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | null {
  const vs = synth.getVoices().filter((v) => /^en[-_]/i.test(v.lang));
  return vs.find((v) => /en[-_]GB/i.test(v.lang) && v.localService) ?? vs.find((v) => /en[-_]US/i.test(v.lang) && v.localService) ?? vs.find((v) => v.localService) ?? vs[0] ?? null;
}

/** Wraps each word of an element in a span (once) with its character range in textContent; layout is unchanged. */
function wrapWords(el: HTMLElement): HTMLElement[] {
  if (el.dataset.words) return Array.from(el.querySelectorAll<HTMLElement>("span[data-a]"));
  const texts: Text[] = [];
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  while (walk.nextNode()) texts.push(walk.currentNode as Text);
  let at = 0;
  for (const t of texts) {
    const frag = document.createDocumentFragment();
    for (const piece of (t.textContent ?? "").split(/(\s+)/)) {
      if (!piece) continue;
      if (/^\s+$/.test(piece)) frag.appendChild(document.createTextNode(piece));
      else { const sp = document.createElement("span"); sp.textContent = piece; sp.dataset.a = String(at); sp.dataset.b = String(at + piece.length); frag.appendChild(sp); }
      at += piece.length;
    }
    t.replaceWith(frag);
  }
  el.dataset.words = "1";
  return Array.from(el.querySelectorAll<HTMLElement>("span[data-a]"));
}

function clearMarks(root: HTMLElement | null) {
  root?.querySelectorAll(".gt-reading, .gt-say").forEach((x) => x.classList.remove("gt-reading", "gt-say"));
}
