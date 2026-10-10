"use client";
/**
 * Book reader for engine stories (docs/SPEC.md §8). Cream paper, Andika, one page at a time,
 * sign drawn over the picture, tappable challenges with response bubbles, stars on a correct answer.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { BookRecord } from "@/lib/types";
import type { Challenge, StoryPageJson } from "@/stories/schema";
import { storyImage } from "@/stories/images";
import { Icon } from "@/components/ui/Icon";

type Page = { kind: "cover" } | { kind: "dedication" } | { kind: "page"; p: StoryPageJson } | { kind: "end" };

export function BookReader({ book, backHref }: { book: BookRecord; backHref: string }) {
  const s = book.story;
  const pages = useMemo<Page[]>(() => [
    { kind: "cover" },
    ...(book.dedication ? [{ kind: "dedication" } as Page] : []),
    ...s.pages.map((p) => ({ kind: "page", p }) as Page),
    { kind: "end" },
  ], [s.pages, book.dedication]);
  const last = pages.length - 1;
  const [i, setI] = useState(0);
  const [chrome, setChrome] = useState(true);
  const [size, setSize] = useState(21);
  const [speaking, setSpeaking] = useState(false);
  const [wordIdx, setWordIdx] = useState<number | null>(null);
  const touch = useRef<number | null>(null);
  const cur = pages[i];

  const go = useCallback((n: number) => {
    window.speechSynthesis?.cancel(); setSpeaking(false); setWordIdx(null);
    setI(Math.max(0, Math.min(last, n)));
  }, [last]);

  useEffect(() => {
    const h = Number(location.hash.replace("#p", ""));
    if (Number.isFinite(h) && h >= 0 && h <= last) setI(h);
    else { try { const v = localStorage.getItem(`gtales.read.${book.id}`); if (v) setI(Math.min(last, Number(v))); } catch {} }
  }, [book.id, last]);
  useEffect(() => {
    history.replaceState(null, "", `#p${i}`);
    try { localStorage.setItem(`gtales.read.${book.id}`, String(i)); } catch {}
    beacon(i === last ? "story_finished" : "page_viewed", book.id, i);
  }, [i, last, book.id]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(i + 1);
      if (e.key === "ArrowLeft") go(i - 1);
      if (e.key === "Escape") setChrome((c) => !c);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [i, go]);

  const words = useMemo(() => (cur.kind === "page" ? cur.p.text.join(" ") : cur.kind === "cover" ? `${s.title}. Starring ${book.child_name}.` : cur.kind === "dedication" ? book.dedication ?? "" : "The end.").split(/\s+/).filter(Boolean), [cur, s.title, book]);
  const readToMe = () => {
    const synth = window.speechSynthesis; if (!synth) return;
    if (speaking) { synth.cancel(); setSpeaking(false); setWordIdx(null); return; }
    const u = new SpeechSynthesisUtterance(words.join(" "));
    u.lang = "en-GB"; u.rate = 0.85;
    const v = synth.getVoices().find((x) => x.lang.startsWith("en") && /female|samantha|google uk english female/i.test(x.name)) || synth.getVoices().find((x) => x.lang.startsWith("en"));
    if (v) u.voice = v;
    let idx = 0;
    u.onboundary = (ev) => { if (ev.name === "word") { setWordIdx(idx); idx++; } };
    u.onend = () => { setSpeaking(false); setWordIdx(null); };
    u.onerror = () => { setSpeaking(false); setWordIdx(null); };
    setSpeaking(true); setWordIdx(0); synth.speak(u);
    beacon("audio_played", book.id, i);
  };

  const onTouchStart = (e: React.TouchEvent) => { touch.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touch.current == null) return;
    const dx = e.changedTouches[0].clientX - touch.current; touch.current = null;
    if (Math.abs(dx) > 50) go(dx < 0 ? i + 1 : i - 1);
  };
  const pageNo = cur.kind === "page" ? cur.p.n : null;

  return (
    <div className="paper min-h-dvh flex flex-col text-paper-ink font-reader select-none" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <header className={`sticky top-0 z-20 flex items-center gap-2 px-3 py-2 bg-paper/95 backdrop-blur border-b border-paper-ink/10 transition-opacity ${chrome ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <Link href={backHref} aria-label="Close the story" className="w-10 h-10 rounded-full grid place-items-center bg-white/70 text-paper-ink no-underline"><Icon name="cross" size={20} strokeWidth={2.5} /></Link>
        <span className="flex-1 text-center display font-bold text-[15px] leading-5 truncate text-paper-ink">{s.title}</span>
        <button type="button" onClick={() => setSize((x) => Math.max(17, x - 2))} aria-label="Smaller text" className="w-10 h-10 rounded-full bg-white/70 font-bold text-sm">A−</button>
        <button type="button" onClick={() => setSize((x) => Math.min(27, x + 2))} aria-label="Larger text" className="w-10 h-10 rounded-full bg-white/70 font-bold text-base">A+</button>
        <button type="button" onClick={readToMe} aria-label={speaking ? "Stop reading" : "Read to me"} aria-pressed={speaking} className={`w-10 h-10 rounded-full grid place-items-center text-ink ${speaking ? "bg-sun" : "bg-cta shadow-[0_3px_0_var(--cta-shadow)]"}`}><Icon name="speaker" size={20} strokeWidth={2.5} /></button>
      </header>

      <main className="flex-1 flex flex-col mx-auto w-full max-w-xl px-5 pt-4 pb-14 relative" onClick={() => setChrome((c) => !c)}>
        {cur.kind === "cover" && (
          <div className="flex flex-col items-center text-center gap-4">
            <Picture src={storyImage(book.slug, book.gender, "cover.jpg")} alt={`The cover of ${s.title}`} ratio="5/7" />
            <h1 className="display text-[30px] leading-9 font-bold text-paper-ink">{s.title}</h1>
            <p className="m-0 font-bold text-paper-ink/70">Starring {book.child_name}</p>
          </div>
        )}
        {cur.kind === "dedication" && (
          <div className="flex-1 flex items-center justify-center text-center px-4"><p className="m-0 italic" style={{ fontSize: size, lineHeight: 1.6 }}>{book.dedication}</p></div>
        )}
        {cur.kind === "page" && <StoryPageView p={cur.p} book={book} size={size} wordIdx={wordIdx} key={cur.p.n} />}
        {cur.kind === "end" && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
            <h2 className="display text-[34px] font-bold text-paper-ink">The End</h2>
            <p className="m-0 font-bold text-paper-ink/70">{book.child_name} unlocked a superpower.</p>
          </div>
        )}
        <div className="mt-auto pt-4 text-center text-sm font-bold text-paper-ink/55">{pageNo ? `— ${pageNo} —` : ""}</div>

        <button type="button" aria-label="Previous page" onClick={(e) => { e.stopPropagation(); go(i - 1); }} disabled={i === 0} className="absolute left-0 top-0 bottom-0 w-[16%] bg-transparent disabled:pointer-events-none" />
        <button type="button" aria-label="Next page" onClick={(e) => { e.stopPropagation(); go(i + 1); }} disabled={i === last} className="absolute right-0 top-0 bottom-0 w-[16%] bg-transparent disabled:pointer-events-none" />
        {i > 0 && <span aria-hidden className="absolute left-2 bottom-3 w-9 h-9 rounded-full bg-white/85 grid place-items-center shadow-[0_2px_0_rgba(61,43,31,.12)]"><Icon name="chevron" className="rotate-90" size={18} strokeWidth={2.5} /></span>}
        {i < last && <span aria-hidden className="absolute right-2 bottom-3 w-9 h-9 rounded-full bg-cta text-ink grid place-items-center shadow-[0_3px_0_var(--cta-shadow)]"><Icon name="chevron" className="-rotate-90" size={18} strokeWidth={2.5} /></span>}
      </main>

      {i === last && (
        <div className="sticky bottom-0 bg-paper/95 border-t border-paper-ink/10 p-3 flex gap-2">
          <Link href={backHref} className="btn-secondary flex-1">Back to the story page</Link>
          <button type="button" onClick={() => go(0)} className="btn-ghost">Read again</button>
        </div>
      )}
    </div>
  );
}

function Picture({ src, alt, ratio = "5/4", sign }: { src: string; alt: string; ratio?: string; sign?: string | null }) {
  const [err, setErr] = useState(false);
  return (
    <div className="relative w-full rounded-[18px] overflow-hidden shadow-[0_2px_0_rgba(61,43,31,.12)] bg-white/60" style={{ aspectRatio: ratio }}>
      {err ? (
        <div className="absolute inset-0 grid place-items-center p-4 text-center text-sm font-bold text-paper-ink/60 border-2 border-dashed border-paper-ink/20 rounded-[18px]">IMAGE NEEDED: {src.split("/").slice(-3).join("/")}</div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} onError={() => setErr(true)} className="absolute inset-0 w-full h-full object-cover" />
      )}
      {sign && <span className="absolute left-[8%] right-[8%] top-[10%] text-center italic font-bold text-[clamp(14px,4vw,20px)] leading-tight text-paper-ink drop-shadow-[0_1px_0_#fff]">{sign}</span>}
    </div>
  );
}

function StoryPageView({ p, book, size, wordIdx }: { p: StoryPageJson; book: BookRecord; size: number; wordIdx: number | null }) {
  let w = 0;
  return (
    <div className="flex flex-col gap-4">
      <Picture src={storyImage(book.slug, book.gender, p.image)} alt={p.text[0] ?? ""} sign={p.sign} />
      <div className="flex flex-col gap-3" style={{ fontSize: size, lineHeight: 1.6 }}>
        {p.text.map((t, j) => (
          <p key={j} className="m-0">
            {t.split(/\s+/).filter(Boolean).map((word, k) => {
              const idx = w++;
              const hl = wordIdx === idx ? "bg-sun rounded px-0.5" : "";
              if (j === 0 && k === 0 && word.length > 1 && /^[A-Za-z]/.test(word)) {
                return <span key={k} className={hl}><span className="display text-flame font-bold text-[1.9em] leading-none float-left mr-0.5 mt-1">{word[0]}</span>{word.slice(1)}{" "}</span>;
              }
              return <span key={k} className={hl}>{word}{" "}</span>;
            })}
          </p>
        ))}
      </div>
      {p.challenge && <ChallengeView c={p.challenge} bookId={book.id} page={p.n} />}
    </div>
  );
}

function ChallengeView({ c, bookId, page }: { c: Challenge; bookId: string; page: number }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState<boolean[]>(() => new Array(c.steps?.length ?? c.count ?? 0).fill(false));
  const [said, setSaid] = useState(false);
  const allDone = done.length > 0 && done.every(Boolean);
  const chosen = picked != null ? c.options?.[picked] : undefined;
  const celebrate = chosen?.correct || allDone || said;
  useEffect(() => { if (celebrate) { beacon("challenge_completed", bookId, page); ding(); } }, [celebrate, bookId, page]);

  return (
    <div className="relative rounded-2xl bg-white border-2 border-paper-ink/10 p-4 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
      <span className="eyebrow !text-flame-deep">Your turn</span>
      <span className="font-bold text-[17px] leading-6">{c.question}</span>
      {c.riddle?.length ? <div className="italic text-[16px] leading-6 text-paper-ink/80">{c.riddle.map((l, k) => <p key={k} className="m-0">{l}</p>)}</div> : null}

      {(c.type === "choice" || c.type === "riddle") && c.options && (
        <div className="flex flex-wrap gap-2">
          {c.options.map((o, k) => (
            <button key={k} type="button" aria-pressed={picked === k} onClick={() => setPicked(k)} className={`chip !text-[16px] ${picked === k ? (o.correct ? "!border-mint !bg-mint-soft !text-mint" : "!border-danger !bg-[#fde8ec] !text-danger") : ""}`}>{o.label}</button>
          ))}
        </div>
      )}
      {chosen && (
        <div className={`rounded-xl px-3 py-2 font-bold text-[15px] leading-5 ${chosen.correct ? "bg-sun-soft text-ink" : "bg-surface-tint text-ink"}`}>{chosen.correct ? "★ " : ""}{chosen.response || (chosen.correct ? "Yes!" : "Try again.")}</div>
      )}

      {c.type === "steps" && c.steps && (
        <ol className="m-0 p-0 list-none flex flex-col gap-2">
          {c.steps.map((st, k) => (
            <li key={k}>
              <button type="button" aria-pressed={done[k]} onClick={() => setDone((d) => d.map((v, j) => (j === k ? !v : v)))} className={`w-full text-left flex items-center gap-3 rounded-xl border-2 px-3 py-2 font-bold text-[16px] ${done[k] ? "border-mint bg-mint-soft" : "border-line bg-white"}`}>
                <span className={`w-7 h-7 rounded-full grid place-items-center shrink-0 ${done[k] ? "bg-mint text-white" : "bg-surface-tint text-ink-soft"}`}>{done[k] ? <Icon name="check" size={16} strokeWidth={3} /> : k + 1}</span>{st}
              </button>
            </li>
          ))}
        </ol>
      )}
      {c.type === "boxes" && (
        <div className="flex gap-3 justify-center">
          {done.map((v, k) => (
            <button key={k} type="button" aria-pressed={v} aria-label={`Box ${k + 1}`} onClick={() => setDone((d) => d.map((x, j) => (j === k ? !x : x)))} className={`w-14 h-14 rounded-2xl border-[3px] grid place-items-center ${v ? "border-mint bg-mint-soft text-mint" : "border-line bg-white"}`}>{v && <Icon name="check" size={28} strokeWidth={3} />}</button>
          ))}
        </div>
      )}
      {c.type === "say" && (
        <button type="button" aria-pressed={said} onClick={() => setSaid(true)} className={`btn-secondary w-full ${said ? "!bg-mint !shadow-[0_4px_0_#075e49]" : ""}`}>{said ? "You said it!" : `Say it: "${c.line ?? c.question}"`}</button>
      )}
      {celebrate && (
        <>
          <svg aria-hidden className="absolute -right-2 -top-3" width="40" height="40" viewBox="0 0 24 24" fill="#ffcf3d"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" /></svg>
          <svg aria-hidden className="absolute -left-2 -bottom-2" width="26" height="26" viewBox="0 0 24 24" fill="#ff5c1f"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" /></svg>
        </>
      )}
    </div>
  );
}

function ding() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx(); const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(660, ctx.currentTime); o.frequency.setValueAtTime(990, ctx.currentTime + 0.12);
    g.gain.setValueAtTime(0.15, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.4);
  } catch {}
}
function beacon(event: string, storyId: string, page?: number) {
  try { navigator.sendBeacon?.("/api/events", new Blob([JSON.stringify({ event, story_id: storyId, page })], { type: "application/json" })); } catch {}
}
