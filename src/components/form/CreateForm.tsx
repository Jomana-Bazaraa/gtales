"use client";
/**
 * Free story form, fast version (SPEC §7.2, 24 Oct): two screens, under a minute.
 * Screen 1 (parent): hero's name, age, boy/girl, which story. Screen 2 (kid): sidekick, Power Word, silly word,
 * plus only what the story needs (other child, "what helps"), place; all optional with 🎲 Surprise me.
 * Empty fields get defaults on submit (src/stories/defaults.ts, applied again by the API).
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TALES } from "@/lib/gtales";
import { sessionId, source, track } from "@/lib/track";
import { Icon } from "@/components/ui/Icon";
import { FORM_DEFAULTS } from "@/stories/defaults";
import { findUnsafe } from "@/stories/safety";
import builderOptions from "../../../stories/builder-options.json";

export interface TaleMeta {
  slug: string;
  available: boolean;
  sets: { boy: boolean; girl: boolean };
  uses: string[];
  title: string; // story title with {{name}}
  other_rule: "not_sibling" | null;
}

const KEY = "gtales.free-draft.v4";
type Card = { label: string; value: string };
const B = builderOptions as unknown as Record<"sidekick" | "power_word" | "silly" | "need", Card[]>;
const SIDEKICKS = B.sidekick.filter((c) => c.value !== "__parent_types__");
const NAMES = ["Sam", "Omar", "Lina", "Yousef", "Malak", "Ziad", "Nour", "Adam"];
const AGES = [4, 5, 6, 7, 8];
const LATIN = /^[A-Za-z][A-Za-z '\-]*$/;
const WORDS = /^[A-Za-z][A-Za-z ]*$/;
const ARABIC = /[؀-ۿ]/;

interface Draft {
  name: string; age: number; gender: "boy" | "girl" | ""; slug: string;
  sidekick: string; power_word: string; silly: string; other: string; need: string; place: string;
}
const EMPTY: Draft = { name: "", age: 0, gender: "", slug: "", sidekick: "", power_word: "", silly: "", other: "", need: FORM_DEFAULTS.need, place: "" };
const pick = <T,>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)];

export function CreateForm({ initialTale, metas }: { initialTale?: string; metas: TaleMeta[] }) {
  const router = useRouter();
  const [d, setD] = useState<Draft>({ ...EMPTY, slug: initialTale ?? "" });
  const [screen, setScreen] = useState<1 | 2>(1);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [own, setOwn] = useState({ sidekick: false, power_word: false, silly: false }); // "Other…" open

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) { const s = JSON.parse(raw) as Draft; setD({ ...EMPTY, ...s, slug: initialTale || s.slug }); } } catch {}
    setReady(true);
    track("story_started", { meta: initialTale ? { tale: initialTale } : undefined });
    track("form_step_1", { meta: initialTale ? { tale: initialTale } : undefined });
  }, [initialTale]);
  useEffect(() => { if (ready) try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {} }, [d, ready]);

  const u = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const meta = useMemo(() => metas.find((m) => m.slug === d.slug), [metas, d.slug]);
  const uses = (t: string) => !!meta && meta.uses.includes(t);
  const bullied = meta?.other_rule === "not_sibling";
  const name = cap(d.name) || "your child";

  const check1 = (): string | null => {
    const n = d.name.trim();
    if (!n) return "Please write the hero's name.";
    if (ARABIC.test(n)) return "Please write the name in English letters, like Mariam.";
    if (n.length > 14 || !LATIN.test(n)) return "Up to 14 English letters, please.";
    if (!d.age) return "Please tap an age.";
    if (!d.gender) return "Please tap boy or girl.";
    if (!d.slug) return "Please pick a story.";
    if (!meta?.available) return "This story is coming soon. Please pick another one.";
    if (!meta.sets[d.gender]) return `The ${d.gender} pictures for this story are coming soon. Please pick another story.`;
    return null;
  };
  const check2 = (): string | null => {
    const sk = d.sidekick.trim(), pw = d.power_word.trim(), sl = d.silly.trim(), ot = d.other.trim(), pl = d.place.trim();
    if (sk && (sk.length > 12 || !LATIN.test(sk))) return "Robot's name: up to 12 English letters.";
    if (pw && (pw.length < 2 || pw.length > 24 || ARABIC.test(pw))) return "Power Word: 2 to 24 English characters.";
    if (sl && (sl.length > 15 || !(WORDS.test(sl) || B.silly.some((c) => c.value === sl)))) return "Silly word: up to 15 letters and spaces.";
    if (ot && (ot.length > 14 || !LATIN.test(ot))) return "Name: up to 14 English letters.";
    if (pl && (pl.length < 2 || pl.length > 20 || ARABIC.test(pl))) return "Place: 2 to 20 English letters, like Maadi.";
    const bad = findUnsafe([sk, pw, sl, ot, pl].join(" "));
    if (bad) return "Please choose another word.";
    return null;
  };

  const next = () => {
    const e = check1(); setErr(e);
    if (e) return;
    setScreen(2); window.scrollTo({ top: 0 });
    track("form_step_2", { meta: { tale: d.slug } });
  };
  const surprise = () => {
    setOwn({ sidekick: false, power_word: false, silly: false });
    setD((p) => ({ ...p, sidekick: pick(SIDEKICKS).value, power_word: pick(B.power_word).value, silly: pick(B.silly).value, other: p.other || pick(NAMES), need: pick(B.need).value }));
    setErr(null);
  };

  const submit = async () => {
    const e = check1() ?? check2();
    if (e) { setErr(e); if (check1()) setScreen(1); return; }
    setBusy(true); setErr(null);
    const body = {
      slug: d.slug, name: cap(d.name), gender: d.gender, age: d.age, half: false,
      place: d.place.trim() || FORM_DEFAULTS.place,
      other: uses("other") ? cap(d.other.trim() || FORM_DEFAULTS.other) : undefined,
      other_relation: uses("other") ? (bullied ? "school" : "friend") : undefined,
      sidekick: uses("sidekick") ? cap(d.sidekick.trim() || FORM_DEFAULTS.sidekick) : undefined,
      power_word: uses("power_word") ? bang(d.power_word.trim() || FORM_DEFAULTS.power_word) : undefined,
      need: uses("need") ? d.need || FORM_DEFAULTS.need : undefined,
      silly: d.silly.trim() || undefined,
      ref: source(), session_id: sessionId(), website: (document.getElementById("website") as HTMLInputElement | null)?.value || "",
    };
    let r: Response;
    try {
      r = await fetch("/api/books", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    } catch {
      setBusy(false);
      return setErr("No connection. Your answers are saved: check the internet and tap again.");
    }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setBusy(false);
      if (r.status === 429) return setErr("Please try again in a little while.");
      if (r.status === 422) return setErr("Please choose another word.");
      const issue = j.issues?.[0];
      if (issue && ["name", "age", "gender", "slug"].includes(issue.path)) setScreen(1);
      return setErr(issue?.message || j.message || "Something went wrong. Please try again.");
    }
    try { localStorage.removeItem(KEY); } catch {}
    router.push(`/story/${j.id}/read`); // straight to the first page
  };

  return (
    <div className="mx-auto max-w-xl w-full flex flex-col min-h-[calc(100dvh-64px)]">
      <div className="flex items-center gap-3 px-4 pt-3 pb-1">
        {screen === 2 ? (
          <button type="button" onClick={() => { setErr(null); setScreen(1); }} aria-label="Back" className="w-12 h-12 rounded-full grid place-items-center text-ink"><Icon name="chevron" className="rotate-90" size={26} strokeWidth={2.5} /></button>
        ) : (
          <Link href="/" aria-label="Back" className="w-12 h-12 rounded-full grid place-items-center text-ink"><Icon name="chevron" className="rotate-90" size={26} strokeWidth={2.5} /></Link>
        )}
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="flex justify-between eyebrow !text-ink-soft"><span>Step {screen} of 2</span><span className="!text-mint">Free story</span></div>
          <div className="h-2 rounded-full bg-sky-soft overflow-hidden"><div className="h-full bg-sky rounded-full transition-all" style={{ width: screen === 1 ? "50%" : "100%" }} /></div>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 flex flex-col gap-5">
        <input id="website" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

        {screen === 1 && (<>
          <label className="flex flex-col gap-1.5">
            <span className="text-[26px] leading-8 font-bold">Who&apos;s the hero of this story?</span>
            <input className="field text-xl" placeholder="e.g. Adam, Jana, Yassin" value={d.name} onChange={(e) => u("name", e.target.value)} maxLength={14} autoComplete="off" autoCapitalize="words" enterKeyHint="next" />
            <span className="text-[14px] leading-5 text-ink-soft">This name becomes the hero of the story. You can use your child&apos;s name, a nickname, or any name you like.</span>
          </label>

          <div className="flex flex-col gap-2">
            <span className="font-bold text-[17px]">How old?</span>
            <div className="grid grid-cols-5 gap-2">{AGES.map((a) => (
              <button key={a} type="button" aria-pressed={d.age === a} onClick={() => u("age", a)} className={`h-14 rounded-2xl border-[3px] display font-bold text-2xl ${d.age === a ? "border-flame bg-flame-soft text-flame-deep" : "border-line bg-white"}`}>{a}</button>
            ))}</div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-bold text-[17px]">Boy or girl?</span>
            <div className="grid grid-cols-2 gap-2">{(["boy", "girl"] as const).map((g) => (
              <button key={g} type="button" aria-pressed={d.gender === g} onClick={() => u("gender", g)} className={`h-14 rounded-2xl border-[3px] font-bold text-xl ${d.gender === g ? "border-flame bg-flame-soft" : "border-line bg-white"}`}>{g === "boy" ? "👦 Boy" : "👧 Girl"}</button>
            ))}</div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-bold text-[17px]">Pick a story</span>
            <div className="grid grid-cols-2 gap-2.5">
              {TALES.map((t) => {
                const m = metas.find((x) => x.slug === t.slug); const on = d.slug === t.slug; const soon = !m?.available;
                return (
                  <button key={t.slug} type="button" aria-pressed={on} disabled={soon} onClick={() => u("slug", t.slug)} className={`relative text-left rounded-2xl border-[3px] overflow-hidden bg-white ${on ? "border-flame" : "border-line"} ${soon ? "opacity-50" : ""}`}>
                    {t.cover && /* eslint-disable-next-line @next/next/no-img-element */ <img src={t.cover} alt="" loading="lazy" className="w-full aspect-[5/4] object-cover object-top" />}
                    <span className="block px-2.5 pt-1.5 font-bold text-[16px] leading-5">{t.title}</span>
                    <span className="block px-2.5 pb-2 text-[12px] leading-4 text-ink-soft">{t.helps}</span>
                    {on && <span className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-flame text-white grid place-items-center"><Icon name="check" size={18} strokeWidth={3} /></span>}
                  </button>
                );
              })}
            </div>
          </div>
        </>)}

        {screen === 2 && (<>
          <div className="flex flex-col gap-2">
            <h1 className="m-0 text-[26px] leading-8 font-bold">Now the fun part! 🎉</h1>
            <p className="m-0 text-[15px] text-ink-soft">Let {name} choose. Everything here is optional.</p>
            <button type="button" onClick={surprise} className="btn-secondary self-start !h-12 text-lg">🎲 Surprise me</button>
          </div>

          <Choice label="Robot friend's name" cards={SIDEKICKS} value={d.sidekick} open={own.sidekick} max={12} placeholder="e.g. Teddy, Lucky"
            onPick={(v) => { u("sidekick", v); setOwn((o) => ({ ...o, sidekick: false })); }} onOwn={() => { setOwn((o) => ({ ...o, sidekick: true })); u("sidekick", ""); }} onType={(v) => u("sidekick", v)} />
          <Choice label="Power Word (said out loud at the brave moment)" cards={B.power_word} value={d.power_word} open={own.power_word} max={24} placeholder="e.g. I can do it!"
            onPick={(v) => { u("power_word", v); setOwn((o) => ({ ...o, power_word: false })); }} onOwn={() => { setOwn((o) => ({ ...o, power_word: true })); u("power_word", ""); }} onType={(v) => u("power_word", v)} />
          <Choice label="Silly word" cards={B.silly} value={d.silly} open={own.silly} max={15} placeholder="Letters and spaces"
            onPick={(v) => { u("silly", v); setOwn((o) => ({ ...o, silly: false })); }} onOwn={() => { setOwn((o) => ({ ...o, silly: true })); u("silly", ""); }} onType={(v) => u("silly", v.replace(/[^A-Za-z ]/g, ""))} />

          {uses("other") && (
            <label className="flex flex-col gap-1.5">
              <span className="font-bold text-[17px]">{bullied ? "A name for the child who is unkind (optional)" : "A brother, sister or friend in the story (optional)"}</span>
              <input className="field" placeholder="e.g. Sam" value={d.other} onChange={(e) => u("other", e.target.value)} maxLength={14} autoComplete="off" />
              <span className="text-[13px] text-ink-soft">{bullied ? "A made-up name is fine. " : ""}Leave it empty and we&apos;ll use Sam.</span>
            </label>
          )}

          {uses("need") && (
            <div className="flex flex-col gap-2">
              <span className="font-bold text-[17px]">What helps when {d.gender === "girl" ? "she's" : d.gender === "boy" ? "he's" : "they're"} upset?</span>
              <div className="grid grid-cols-2 gap-2">{B.need.map((c) => (
                <button key={c.value} type="button" aria-pressed={d.need === c.value} onClick={() => u("need", c.value)} className={`min-h-12 rounded-2xl border-[3px] px-3 py-2 font-bold text-[15px] text-left ${d.need === c.value ? "border-flame bg-flame-soft" : "border-line bg-white"}`}>{c.label}</button>
              ))}</div>
            </div>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="font-bold text-[17px]">Where do you live? (optional)</span>
            <input className="field" placeholder="e.g. Maadi, Smouha, Sheikh Zayed" value={d.place} onChange={(e) => u("place", e.target.value)} maxLength={20} />
            <span className="text-[13px] text-ink-soft">It appears in the story. Leave it empty for Cairo.</span>
          </label>
        </>)}

        {err && <p role="alert" className="m-0 text-sm font-bold text-danger">{err}</p>}
      </div>

      <div className="sticky bottom-0 bg-white border-t border-line px-4 py-3 flex flex-col gap-2">
        {screen === 1
          ? <button type="button" onClick={next} className="btn-primary w-full !h-14 text-lg">Next →</button>
          : <button type="button" onClick={submit} disabled={busy} className="btn-primary w-full !h-16 text-xl">{busy ? "Making the story…" : "Make my story! ✨"}</button>}
        <span className="text-center text-xs font-bold text-ink-soft">Free · No photo, no phone number, no address.</span>
      </div>
    </div>
  );
}

/** Cards + "Other…" free text (SPEC §7.2 screen 2). */
function Choice({ label, cards, value, open, max, placeholder, onPick, onOwn, onType }: { label: string; cards: Card[]; value: string; open: boolean; max: number; placeholder: string; onPick: (v: string) => void; onOwn: () => void; onType: (v: string) => void }) {
  const custom = open || (!!value && !cards.some((c) => c.value === value));
  return (
    <div className="flex flex-col gap-2">
      <span className="font-bold text-[17px]">{label}</span>
      <div className="flex flex-wrap gap-2">
        {cards.map((c) => <button key={c.value} type="button" aria-pressed={!custom && value === c.value} onClick={() => onPick(c.value)} className={`chip ${!custom && value === c.value ? "chip-on" : ""}`}>{c.label}</button>)}
        <button type="button" aria-pressed={custom} onClick={onOwn} className={`chip ${custom ? "chip-on" : ""}`}>Other…</button>
      </div>
      {custom && <input className="field" autoFocus placeholder={placeholder} value={value} onChange={(e) => onType(e.target.value)} maxLength={max} autoComplete="off" />}
    </div>
  );
}
function cap(s: string) {
  return s.trim().replace(/\s+/g, " ").split(" ").map((w) => w.split("-").map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p)).join("-")).join(" ");
}
function bang(s: string) { const t = s.trim(); return /[.!?]$/.test(t) ? t : `${t}!`; }
