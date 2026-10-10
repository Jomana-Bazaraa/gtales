"use client";
/**
 * Story reader — docs/SPEC.md §8. Cream paper, Andika, one page at a time,
 * swipe / edge-tap / arrows / keyboard, "Read to me" with word highlighting.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { StoryRecord, StoryPage } from "@/lib/types";
import type { ActivityId } from "@/lib/activities/registry";
import { Activity } from "../activities/Activity";
import { Icon } from "@/components/ui/Icon";

interface Props { story: StoryRecord; backHref: string }

export function Reader({ story, backHref }: Props) {
  const a = story.assembled!;
  const pages = useMemo(() => a.pages.filter((p) => p.kind !== "parents"), [a.pages]);
  const [i, setI] = useState(0);
  const [chrome, setChrome] = useState(true);
  const [size, setSize] = useState(21);
  const [speaking, setSpeaking] = useState(false);
  const [wordIdx, setWordIdx] = useState<number | null>(null);
  const touch = useRef<number | null>(null);
  const page = pages[i];
  const last = pages.length - 1;

  const go = useCallback((n: number) => {
    window.speechSynthesis?.cancel();
    setSpeaking(false); setWordIdx(null);
    setI((cur) => Math.max(0, Math.min(last, typeof n === "number" ? n : cur)));
  }, [last]);

  // deep link + persistence
  useEffect(() => {
    const h = Number(location.hash.replace("#p", ""));
    if (Number.isFinite(h) && h >= 0 && h <= last) setI(h);
    try { const s = localStorage.getItem(`gtales.read.${story.id}`); if (!location.hash && s) setI(Math.min(last, Number(s))); } catch {}
  }, [story.id, last]);
  useEffect(() => {
    history.replaceState(null, "", `#p${i}`);
    try { localStorage.setItem(`gtales.read.${story.id}`, String(i)); } catch {}
    if (i === last) track("story_finished", story.id);
    else track("page_viewed", story.id, i);
  }, [i, last, story.id]);

  // keyboard
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); go(i + 1); }
      if (e.key === "ArrowLeft") go(i - 1);
      if (e.key === "Escape") setChrome((c) => !c);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [i, go]);

  // Read to me (Web Speech API, SPEC §8)
  const words = useMemo(() => (page.paragraphs ?? []).join(" ").split(/\s+/).filter(Boolean), [page]);
  const readToMe = () => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (speaking) { synth.cancel(); setSpeaking(false); setWordIdx(null); return; }
    const text = page.kind === "cover" ? `${a.title}. Starring ${story.input.childName}.` : words.join(" ");
    if (!text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-GB"; u.rate = 0.85;
    const v = synth.getVoices().find((x) => x.lang.startsWith("en") && /female|child|kid|samantha|google uk english female/i.test(x.name)) || synth.getVoices().find((x) => x.lang.startsWith("en"));
    if (v) u.voice = v;
    let idx = 0;
    u.onboundary = (ev) => { if (ev.name === "word") { setWordIdx(idx); idx++; } };
    u.onend = () => { setSpeaking(false); setWordIdx(null); };
    u.onerror = () => { setSpeaking(false); setWordIdx(null); };
    setSpeaking(true); setWordIdx(0);
    synth.speak(u);
    track("audio_played", story.id, i);
  };

  // swipe
  const onTouchStart = (e: React.TouchEvent) => { touch.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touch.current == null) return;
    const dx = e.changedTouches[0].clientX - touch.current;
    touch.current = null;
    if (Math.abs(dx) > 50) go(dx < 0 ? i + 1 : i - 1);
  };

  return (
    <div className="paper min-h-dvh flex flex-col text-paper-ink font-reader select-none" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* top bar, toggled by tapping the page */}
      <header className={`sticky top-0 z-20 flex items-center gap-2 px-3 py-2 bg-paper/95 backdrop-blur border-b border-paper-ink/10 transition-opacity ${chrome ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <Link href={backHref} aria-label="Close the story" className="w-10 h-10 rounded-full grid place-items-center bg-white/70 text-paper-ink no-underline"><Icon name="cross" size={20} strokeWidth={2.5} /></Link>
        <span className="flex-1 text-center display font-bold text-[15px] leading-5 truncate text-paper-ink">{a.title}</span>
        <button type="button" onClick={() => setSize((s) => Math.max(17, s - 2))} aria-label="Smaller text" className="w-10 h-10 rounded-full bg-white/70 font-bold text-sm">A−</button>
        <button type="button" onClick={() => setSize((s) => Math.min(27, s + 2))} aria-label="Larger text" className="w-10 h-10 rounded-full bg-white/70 font-bold text-base">A+</button>
        <button type="button" onClick={readToMe} aria-label={speaking ? "Stop reading" : "Read to me"} aria-pressed={speaking} className={`w-10 h-10 rounded-full grid place-items-center text-ink ${speaking ? "bg-sun" : "bg-cta shadow-[0_3px_0_var(--cta-shadow)]"}`}><Icon name="speaker" size={20} strokeWidth={2.5} /></button>
      </header>

      <main className="flex-1 flex flex-col mx-auto w-full max-w-xl px-5 pt-4 pb-14 relative" onClick={() => setChrome((c) => !c)}>
        <PageView page={page} story={story} size={size} wordIdx={wordIdx} pageNo={pageNumber(pages, i)} />
        <div className="mt-auto pt-4 text-center text-sm font-bold text-paper-ink/55">{page.kind === "cover" ? "" : `— ${pageNumber(pages, i)} —`}</div>

        {/* edge taps and arrows */}
        <button type="button" aria-label="Previous page" onClick={(e) => { e.stopPropagation(); go(i - 1); }} disabled={i === 0} className="absolute left-0 top-0 bottom-0 w-[18%] bg-transparent disabled:pointer-events-none" />
        <button type="button" aria-label="Next page" onClick={(e) => { e.stopPropagation(); go(i + 1); }} disabled={i === last} className="absolute right-0 top-0 bottom-0 w-[18%] bg-transparent disabled:pointer-events-none" />
        {i > 0 && <span aria-hidden className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 grid place-items-center shadow-[0_2px_0_rgba(61,43,31,.12)]"><Icon name="chevron" className="rotate-90" size={18} strokeWidth={2.5} /></span>}
        {i < last && <span aria-hidden className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-cta text-ink grid place-items-center shadow-[0_3px_0_var(--cta-shadow)]"><Icon name="chevron" className="-rotate-90" size={18} strokeWidth={2.5} /></span>}
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

function pageNumber(pages: StoryPage[], i: number) {
  return pages.slice(0, i + 1).filter((p) => p.kind !== "cover").length;
}

function PageView({ page, story, size, wordIdx, pageNo }: { page: StoryPage; story: StoryRecord; size: number; wordIdx: number | null; pageNo: number }) {
  const img = page.imageUrl ?? (page.kind === "cover" ? story.cover_url ?? undefined : undefined);
  const style = { fontSize: size, lineHeight: 1.6 };
  switch (page.kind) {
    case "cover":
      return (
        <div className="flex flex-col items-center text-center gap-4 pt-4">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={`The cover of ${story.assembled!.title}`} className="w-full aspect-square object-cover rounded-[18px] shadow-[0_2px_0_rgba(61,43,31,.12)]" />
          ) : (
            <div className="w-full aspect-square rounded-[18px] grid place-items-center bg-white/60 text-sm font-bold text-paper-ink/60 border-2 border-dashed border-paper-ink/20">IMAGE NEEDED: cover</div>
          )}
          <h1 className="display text-[30px] leading-9 font-bold text-paper-ink">{page.title ?? story.assembled!.title}</h1>
          <p className="m-0 font-bold text-paper-ink/70">Starring {story.input.childName}</p>
        </div>
      );
    case "text": {
      let w = 0;
      return (
        <div className="flex flex-col gap-4">
          {img && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={page.paragraphs?.[0] ?? ""} className="w-full aspect-square object-cover rounded-[18px] shadow-[0_2px_0_rgba(61,43,31,.12)]" />
          )}
          <div className="flex flex-col gap-3" style={style}>
            {page.paragraphs?.map((t, j) => (
              <p key={j} className="m-0">
                {t.split(/\s+/).filter(Boolean).map((word, k) => {
                  const idx = w++;
                  const first = j === 0 && k === 0;
                  const hl = wordIdx === idx ? "bg-sun rounded px-0.5" : "";
                  if (first && word.length > 1) {
                    return (
                      <span key={k} className={hl}>
                        <span className="display text-flame font-bold text-[1.9em] leading-none float-left mr-1 mt-1">{word[0]}</span>{word.slice(1)}{" "}
                      </span>
                    );
                  }
                  return <span key={k} className={hl}>{word}{" "}</span>;
                })}
              </p>
            ))}
          </div>
        </div>
      );
    }
    case "challenge":
      return (
        <div className="rounded-2xl bg-white border-2 border-paper-ink/10 p-4 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
          <span className="eyebrow !text-flame-deep">Your turn</span>
          <Activity id={story.input.challengeType as ActivityId} ctx={{ story, mode: "web", variant: "color" }} challenge={story.generated?.challenge ?? null} />
        </div>
      );
    case "activity":
      return (
        <div className="rounded-2xl bg-white border-2 border-paper-ink/10 p-4 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
          <span className="eyebrow !text-sky">Play page {pageNo}</span>
          <Activity id={page.activity as ActivityId} ctx={{ story, mode: "web", variant: "color" }} />
        </div>
      );
    case "badge":
      return (
        <div className="mx-auto w-full text-center rounded-[28px] border-4 border-dashed border-sun bg-white p-6 flex flex-col gap-2">
          <span className="eyebrow !text-ink-soft">Certificate</span>
          <h2 className="display text-[30px] font-bold text-ink">{story.input.childName}</h2>
          <p className="m-0 font-bold text-sky text-lg">unlocked a new superpower</p>
          <p className="m-0 text-ink-soft">{story.assembled!.title}</p>
          <div className="mt-4 grid grid-cols-2 gap-6 text-xs text-ink-soft"><div><div className="border-b-2 border-ink h-7" />Signed</div><div><div className="border-b-2 border-ink h-7" />Date</div></div>
        </div>
      );
    default:
      return null;
  }
}

function track(event: string, storyId: string, page?: number) {
  try {
    const body = JSON.stringify({ event, story_id: storyId, page });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
  } catch {}
}
