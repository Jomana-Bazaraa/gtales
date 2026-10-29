"use client";
/**
 * GTales parent form — the form brief (docs/SPEC.md §7.2).
 * One question per screen, exact wording from the brief, only the fields the story `uses`,
 * live cover preview, review sentence, progress saved in the browser.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { sessionId, source, track } from "@/lib/track";
import { findUnsafe } from "@/stories/safety";
import { FORM_DEFAULTS } from "@/stories/defaults";
import { EMAIL_RE, egyptMobile } from "@/lib/contact";
import builderOptions from "../../../stories/builder-options.json";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TALES } from "@/lib/gtales";
import { storyImage } from "@/stories/images";
import { Icon } from "@/components/ui/Icon";

export interface TaleMeta {
  slug: string;
  available: boolean;
  sets: { boy: boolean; girl: boolean };
  uses: string[];
  title: string; // story title with {{name}}
  other_rule: "not_sibling" | null;
}

const KEY = "gtales.free-draft.v6"; // v6 (U1–U3): no place, new option lists; older drafts start fresh
type Step = "struggle" | "name" | "gender" | "age" | "other" | "sidekick" | "power_word" | "silly" | "need" | "dedication" | "email" | "review";

interface Draft {
  slug: string; name: string; gender: "boy" | "girl" | ""; age: number | 0;
  other: string; relation: string; sidekick: string; power_word: string; // relation: a companion chip value (builder-options.json)
  need: string; dedication: string; email: string; silly: string;
  phone: string; byPhone: boolean; // "No email? Use your WhatsApp number instead"
}
const EMPTY: Draft = { slug: "", name: "", gender: "", age: 0, other: "", relation: "", sidekick: "", power_word: "", need: "", dedication: "", email: "", silly: "", phone: "", byPhone: false };

const STRUGGLE_LABEL: Record<string, string> = { anger: "Anger and hitting", anxiety: "Fears and worries", bullied: "Being bullied", lying: "Lying", feelings: "Big feelings", friendship: "Friendship" };
// Story Builder cards: the team edits stories/builder-options.json, not this file.
type BuilderCard = { label: string; value: string; default?: string };
const BUILDER = builderOptions as unknown as Record<"sidekick" | "power_word" | "silly" | "need" | "companion", BuilderCard[]>;
/** Who joins the hero: the chip's default name when no name is written; nothing picked = Zuzu. */
const companionName = (relation: string) => BUILDER.companion.find((c) => c.value === relation)?.default ?? FORM_DEFAULTS.companion;
const OTHER_LABEL = "✏️ Other…";
const LATIN = /^[A-Za-z][A-Za-z '\-]*$/;
const ARABIC = /[؀-ۿ]/;
const pick = (cards: BuilderCard[]) => cards[Math.floor(Math.random() * cards.length)].value;
type BuilderStep = "sidekick" | "power_word" | "silly" | "need";
const BUILDER_STEPS: BuilderStep[] = ["sidekick", "power_word", "silly", "need"];
const SURPRISE: Record<BuilderStep, () => string> = {
  sidekick: () => pick(BUILDER.sidekick),
  power_word: () => pick(BUILDER.power_word),
  silly: () => pick(BUILDER.silly),
  need: () => pick(BUILDER.need),
};
// Enter / Next on an empty builder page uses these (the same values the story falls back to).
const EMPTY_BUILDER: Record<BuilderStep, () => string> = { sidekick: () => FORM_DEFAULTS.sidekick, power_word: () => FORM_DEFAULTS.power_word, silly: SURPRISE.silly, need: () => FORM_DEFAULTS.need };

function Card({ on, onClick, children, disabled, sub }: { on: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean; sub?: string }) {
  return (
    <button type="button" aria-pressed={on} disabled={disabled} onClick={onClick} className={`min-h-14 text-left rounded-2xl border-[3px] px-4 py-3 font-bold text-[17px] flex items-center justify-between gap-3 transition ${on ? "border-flame bg-flame-soft" : "border-line bg-white"} ${disabled ? "opacity-60" : ""}`}>
      <span className="flex flex-col"><span>{children}</span>{sub && <span className="text-[12px] font-bold text-ink-soft">{sub}</span>}</span>
      {on && <Icon name="check" size={22} strokeWidth={3} className="text-flame-deep shrink-0" />}
    </button>
  );
}
const Q = ({ children, help }: { children: React.ReactNode; help?: string }) => (
  <div className="flex flex-col gap-1.5">
    <h1 className="text-[26px] leading-8 md:text-3xl font-bold">{children}</h1>
    {help && <p className="m-0 text-[15px] leading-[22px] text-ink-soft">{help}</p>}
  </div>
);

export function CreateForm({ initialTale, metas }: { initialTale?: string; metas: TaleMeta[] }) {
  const router = useRouter();
  const [d, setD] = useState<Draft>({ ...EMPTY, slug: initialTale ?? "" });
  const [i, setI] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  // "✏️ Other…" free text open on these builder pages
  const [own, setOwn] = useState<Record<"sidekick" | "power_word" | "silly", boolean>>({ sidekick: false, power_word: false, silly: false });
  const setOwnFor = (k: "sidekick" | "power_word" | "silly", v: boolean) => setOwn((o) => ({ ...o, [k]: v }));
  // dRef is always the latest draft, so "Surprise me" then Enter (or a fast tap on Next) never reads a stale value
  const dRef = useRef(d); // every change goes through put(), so this never lags behind d

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const s = JSON.parse(raw) as { d: Draft; i: number }; const saved = { ...EMPTY, ...s.d, slug: initialTale || s.d.slug }; dRef.current = saved; setD(saved); setI(initialTale && s.i === 0 ? 1 : s.i); }
      else if (initialTale) setI(1);
    } catch {}
    setReady(true);
    track("story_started", { meta: initialTale ? { tale: initialTale } : undefined });
  }, [initialTale]);
  useEffect(() => { if (ready) try { localStorage.setItem(KEY, JSON.stringify({ d, i })); } catch {} }, [d, i, ready]);

  const put = (patch: Partial<Draft>) => { const n = { ...dRef.current, ...patch }; dRef.current = n; setD(n); return n; };
  const u = <K extends keyof Draft>(k: K, v: Draft[K]) => put({ [k]: v } as Partial<Draft>);
  const nextRef = useRef<HTMLButtonElement>(null);
  const surprise = (s: BuilderStep) => { if (s !== "need") setOwnFor(s, false); u(s, SURPRISE[s]()); setErr(null); nextRef.current?.focus(); };
  const meta = useMemo(() => metas.find((m) => m.slug === d.slug), [metas, d.slug]);
  const uses = (t: string) => !!meta && meta.uses.includes(t);
  const steps = useMemo<Step[]>(() => {
    const s: Step[] = ["struggle", "name", "gender", "age"]; // no place question: {{place}} is always Egypt (U1)
    if (uses("other")) s.push("other");
    if (uses("sidekick")) s.push("sidekick");
    if (uses("power_word")) s.push("power_word");
    if (uses("sidekick")) s.push("silly"); // optional; the fun lines need the robot
    if (uses("need")) s.push("need");
    s.push("dedication", "email", "review");
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta]);
  const step = steps[Math.min(i, steps.length - 1)];
  // invisible: which page parents reach (Dashboard funnel, SPEC §13 free_form_step)
  useEffect(() => { if (ready && meta) track("free_form_step", { page: i + 1, meta: { name: step, tale: meta.slug } }); }, [i, step, ready, meta]);
  const total = meta ? steps.length - 1 : 12; // review is not counted; 12 until a story is chosen
  const name = d.name.trim() ? cap(d.name) : "your child";
  const he = d.gender === "girl" ? "she" : "he", him = d.gender === "girl" ? "her" : "him", His = d.gender === "girl" ? "Her" : "His";
  const bullied = meta?.other_rule === "not_sibling";
  const previewGender: "boy" | "girl" | null = !meta ? null : d.gender && meta.sets[d.gender] ? d.gender : meta.sets.boy ? "boy" : meta.sets.girl ? "girl" : null;
  const goTo = (s: Step) => { setErr(null); setI(steps.indexOf(s)); };

  const valid = (s: Step, d: Draft = dRef.current): string | null => {
    const meta = metas.find((m) => m.slug === d.slug);
    switch (s) {
      case "struggle": return d.slug ? (meta?.available ? null : "This story is coming soon. Please pick another one.") : "Please choose one.";
      case "name": { const n = d.name.trim(); if (!n) return "Please write your child's name."; if (ARABIC.test(n)) return "Please write the name in English letters, like Mariam."; if (n.length > 14) return "Up to 14 letters, please."; if (!LATIN.test(n)) return "English letters only, please."; return null; }
      case "gender": if (!d.gender) return "Please choose one."; if (meta && !meta.sets[d.gender]) return `The ${d.gender} pictures for this story are coming soon. Please choose another story for now.`; return null;
      case "age": return d.age ? null : "Please choose an age.";
      case "other": { const o = d.other.trim(); if (!o) return null; /* optional: bullied = "Sam", others = the chip's name or Zuzu, on submit */ if (ARABIC.test(o)) return "Please write the name in English letters."; if (o.length > 20 || !LATIN.test(o)) return "Up to 20 English letters, please."; return null; }
      case "sidekick": { const s2 = d.sidekick.trim(); if (s2 && (s2.length > 12 || ARABIC.test(s2))) return "Up to 12 English letters, please."; return null; }
      case "power_word": { const p = d.power_word.trim(); if (p.length < 2 || p.length > 25) return "2 to 25 characters, please."; return findUnsafe(p) ? "Please choose other words." : null; }
      case "need": return d.need ? null : "Please choose one.";
      case "silly": { const w = d.silly.trim(); if (!w || BUILDER.silly.some((c) => c.value === w)) return null; if (w.length > 15 || !/^[A-Za-z][A-Za-z ]*$/.test(w)) return "Up to 15 letters and spaces, please."; return findUnsafe(w) ? "Please choose another word." : null; }
      case "dedication": return d.dedication.length > 120 ? "Up to 120 characters, please." : null;
      case "email": if (d.byPhone) return egyptMobile(d.phone) ? null : "Please write an Egyptian mobile number, like 010 1234 5678.";
        return EMAIL_RE.test(d.email.trim()) ? null : "Please write your email address.";
      default: return null;
    }
  };
  const next = () => {
    let cur = dRef.current;
    if ((BUILDER_STEPS as Step[]).includes(step) && !cur[step as BuilderStep].trim()) { if (step !== "need") setOwnFor(step as "sidekick" | "power_word" | "silly", false); cur = put({ [step]: EMPTY_BUILDER[step as BuilderStep]() }); }
    const e = valid(step, cur); setErr(e); if (!e) setI((x) => Math.min(steps.length - 1, x + 1));
  };
  // Enter anywhere on the page (not in the message box, not on a button) = Next; inputs submit the <form> below
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key !== "Enter" || e.isComposing || t.closest("button, a, textarea, input, select")) return;
      e.preventDefault(); nextRef.current?.click();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const back = () => { setErr(null); setI((x) => Math.max(0, x - 1)); };

  const otherName = (d: Draft) => cap(d.other.trim() || (bullied ? FORM_DEFAULTS.bully : companionName(d.relation)));
  const values = (d: Draft = dRef.current) => ({
    slug: d.slug, name: cap(d.name), gender: d.gender || "boy", age: d.age || 6, place: FORM_DEFAULTS.place,
    other: uses("other") ? otherName(d) : undefined, other_relation: uses("other") ? (bullied ? "school" : d.relation || "friend") : undefined,
    sidekick: uses("sidekick") ? cap(d.sidekick.trim() || FORM_DEFAULTS.sidekick) : undefined,
    power_word: uses("power_word") ? bang(d.power_word) : undefined,
    need: uses("need") ? d.need : undefined,
    silly: d.silly || undefined,
    dedication: d.dedication.trim() || undefined, parent_name: d.byPhone ? "" : d.email.trim().split("@")[0], contact: d.byPhone ? egyptMobile(d.phone) ?? d.phone.trim() : d.email.trim(),
  });

  const submit = async () => {
    for (const s of steps) { const e = valid(s); if (e) { setI(steps.indexOf(s)); return setErr(e); } }
    setBusy(true); setErr(null);
    let r: Response;
    try {
      r = await fetch("/api/books", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...values(), ref: safeRef(), session_id: sessionId(), website: (document.getElementById("website") as HTMLInputElement | null)?.value || "" }) });
    } catch {
      setBusy(false);
      return setErr("No connection. Your answers are saved: check the internet and tap again.");
    }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setBusy(false);
      if (r.status === 429) return setErr("Please try again in a little while.");
      if (r.status === 422) { goTo(stepFor(j.field)); return setErr("Please choose another word."); }
      if (r.status === 400 && j.issues?.[0]) { goTo(stepFor(j.issues[0].path)); return setErr(j.issues[0].message); }
      if (r.status === 404) { goTo("struggle"); return setErr(j.message); }
      return setErr("Something went wrong. Please try again.");
    }
    try { localStorage.removeItem(KEY); } catch {}
    router.push(`/story/${j.id}`);
  };


  return (
    <div className="mx-auto max-w-xl w-full flex flex-col min-h-[calc(100dvh-64px)]">
      <div className="flex items-center gap-3 px-4 pt-3 pb-1">
        {i > 0 ? (
          <button type="button" onClick={back} aria-label="Back" className="w-12 h-12 rounded-full grid place-items-center text-ink"><Icon name="chevron" className="rotate-90" size={26} strokeWidth={2.5} /></button>
        ) : (
          <Link href="/tales" aria-label="Back" className="w-12 h-12 rounded-full grid place-items-center text-ink"><Icon name="chevron" className="rotate-90" size={26} strokeWidth={2.5} /></Link>
        )}
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="flex justify-between eyebrow !text-ink-soft"><span>{step === "review" ? "Check and go" : `${i + 1} of ${total}`}</span><span className="!text-mint">Free story</span></div>
          <div className="h-2 rounded-full bg-sky-soft overflow-hidden"><div className="h-full bg-sky rounded-full transition-all" style={{ width: `${Math.min(100, ((i + 1) / total) * 100)}%` }} /></div>
        </div>
      </div>

      {/* live cover preview once the name is in */}
      {meta && d.name.trim() && previewGender && step !== "review" && step !== "name" && (
        <CoverPreview slug={d.slug} gender={previewGender} title={meta.title.replace(/\{\{name\}\}/g, name)} name={name} />
      )}

      <form noValidate onSubmit={(e) => { e.preventDefault(); if (step === "review") { if (!busy) void submit(); } else next(); }} className="flex-1 flex flex-col">
      <div className="flex-1 px-4 py-5 flex flex-col gap-4">
        <input id="website" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

        {step === "struggle" && (<>
          <Q>What would you like help with right now?</Q>
          <div className="flex flex-col gap-2.5">
            {TALES.map((t) => { const m = metas.find((x) => x.slug === t.slug); const soon = !m?.available; return (
              <Card key={t.slug} on={d.slug === t.slug} disabled={soon} onClick={() => u("slug", t.slug)} sub={soon ? "Coming soon" : undefined}>{STRUGGLE_LABEL[t.slug] ?? t.title}</Card>
            ); })}
          </div>
        </>)}

        {step === "name" && (<>
          <Q>What's your child's name?</Q>
          <input className="field text-xl" autoFocus placeholder="e.g. Adam, Jana, Yassin" value={d.name} onChange={(e) => u("name", e.target.value)} maxLength={14} enterKeyHint="next" />
          {d.name.trim() && meta && previewGender && <CoverPreview slug={d.slug} gender={previewGender} title={meta.title.replace(/\{\{name\}\}/g, name)} name={name} inline />}
        </>)}

        {step === "gender" && (<>
          <Q help="This picks the pictures and he/she in the story.">Is your child a boy or a girl?</Q>
          <div className="grid grid-cols-2 gap-3">
            {(["boy", "girl"] as const).map((g) => (
              <button key={g} type="button" aria-pressed={d.gender === g} onClick={() => u("gender", g)} className={`h-24 rounded-2xl border-[3px] font-bold text-xl flex flex-col items-center justify-center gap-1 ${d.gender === g ? "border-flame bg-flame-soft" : "border-line bg-white"} ${meta && !meta.sets[g] ? "opacity-60" : ""}`}>
                {g === "boy" ? "Boy" : "Girl"}
                {meta && !meta.sets[g] && <span className="pill bg-sun-soft text-ink !text-[10px]">Coming soon</span>}
              </button>
            ))}
          </div>
        </>)}

        {step === "age" && (<>
          <Q>How old is your child?</Q>
          <div className="flex flex-wrap gap-2">{[2, 3, 4, 5, 6, 7, 8, 9, 10].map((a) => <button key={a} type="button" aria-pressed={d.age === a} onClick={() => u("age", a)} className={`w-[52px] h-[52px] rounded-full border-[3px] display font-bold text-xl ${d.age === a ? "border-flame bg-flame-soft text-flame-deep" : "border-line bg-white"}`}>{a}</button>)}</div>
        </>)}

        {step === "other" && (bullied ? (<>
          <Q help="You can use a made-up name. It does not have to be the real child.">What name should we use for the child who is unkind?</Q>
          <input className="field text-xl" autoFocus placeholder="e.g. Sam" value={d.other} onChange={(e) => u("other", e.target.value)} maxLength={14} enterKeyHint="next" />
          <p className="m-0 text-[13px] text-ink-soft">Leave it empty and we&apos;ll use Sam.</p>
        </>) : (<>
          <Q help="Optional. Pick who it is, then a name if you like.">Who should join {name} in the story?</Q>
          <div className="flex flex-wrap gap-2">
            {BUILDER.companion.map((c) => <button key={c.value} type="button" aria-pressed={d.relation === c.value} onClick={() => u("relation", d.relation === c.value ? "" : c.value)} className={`chip ${d.relation === c.value ? "chip-on" : ""}`}>{c.label}</button>)}
          </div>
          <input className="field text-xl" placeholder={`e.g. ${d.relation ? companionName(d.relation) : "Omar"}`} value={d.other} onChange={(e) => u("other", e.target.value)} maxLength={20} enterKeyHint="next" />
          <p className="m-0 text-[13px] text-ink-soft">Leave the name empty and we&apos;ll use {d.relation ? companionName(d.relation) : FORM_DEFAULTS.companion}.</p>
        </>))}

        {step === "sidekick" && (<>
          <Q help="In the story, a little robot friend will have this name.">What should the robot friend be called?</Q>
          <OwnChips cards={BUILDER.sidekick} value={d.sidekick} own={own.sidekick} onPick={(v) => { setOwnFor("sidekick", false); u("sidekick", v); }} onOwn={() => { setOwnFor("sidekick", true); u("sidekick", ""); }} />
          {own.sidekick && <input className="field text-xl" autoFocus placeholder="The robot's name" value={d.sidekick} onChange={(e) => u("sidekick", e.target.value)} maxLength={12} enterKeyHint="next" />}
          <button type="button" onClick={() => surprise("sidekick")} className="chip self-start">🎲 Surprise me</button>
        </>)}

        {step === "power_word" && (<>
          <Q help="Your child will say this out loud in the story, at the brave moment.">What does your child say to feel strong or brave?</Q>
          <OwnChips cards={BUILDER.power_word} value={d.power_word} own={own.power_word} onPick={(v) => { setOwnFor("power_word", false); u("power_word", v); }} onOwn={() => { setOwnFor("power_word", true); u("power_word", ""); }} />
          {own.power_word && <input className="field text-xl" autoFocus placeholder="Up to 25 characters" value={d.power_word} onChange={(e) => u("power_word", e.target.value)} maxLength={25} enterKeyHint="next" />}
          <button type="button" onClick={() => surprise("power_word")} className="chip self-start">🎲 Surprise me</button>
        </>)}

        {step === "need" && (<>
          <Q>When your child is sad or in a bad mood, what helps most?</Q>
          <div className="flex flex-col gap-2.5">{BUILDER.need.map((c) => <Card key={c.value} on={d.need === c.value} onClick={() => u("need", c.value)}>{c.label}</Card>)}</div>
          <button type="button" onClick={() => surprise("need")} className="chip self-start">🎲 Surprise me</button>
        </>)}

        {step === "silly" && (<>
          <Q help="Optional. The robot shouts it in the story.">Pick a silly word!</Q>
          <div className="grid grid-cols-2 gap-2.5">
            {BUILDER.silly.map((c) => <Card key={c.value} on={!own.silly && d.silly === c.value} onClick={() => { setOwnFor("silly", false); u("silly", c.value); }}>{c.label}</Card>)}
            <Card on={own.silly} onClick={() => { setOwnFor("silly", true); u("silly", ""); }}>{OTHER_LABEL}</Card>
          </div>
          <button type="button" onClick={() => surprise("silly")} className="chip self-start">🎲 Surprise me</button>
          {own.silly && <input className="field text-xl" autoFocus placeholder="Letters and spaces" value={d.silly} onChange={(e) => u("silly", e.target.value.replace(/[^A-Za-z ]/g, ""))} maxLength={15} enterKeyHint="next" />}
        </>)}


        {step === "dedication" && (<>
          <Q help="Optional. It goes on the first page.">Would you like to add a message for {name}?</Q>
          <textarea className="field text-lg min-h-28" autoFocus placeholder={`e.g. For ${name}, who builds the tallest towers. We love you. Mama & Baba`} value={d.dedication} onChange={(e) => u("dedication", e.target.value)} maxLength={120} />
          <span className="text-[12px] font-bold text-ink-soft text-right">{d.dedication.length} / 120</span>
        </>)}

        {step === "email" && (<>
          {d.byPhone ? (<>
            <Q help="We use it only about your story. Nothing else.">What&apos;s your WhatsApp number?</Q>
            <input key="phone" className="field text-xl" type="tel" inputMode="tel" autoComplete="tel" autoFocus placeholder="e.g. 010 1234 5678" value={d.phone} onChange={(e) => u("phone", e.target.value)} maxLength={20} enterKeyHint="next" />
            <button type="button" onClick={() => { put({ byPhone: false }); setErr(null); }} className="self-start text-[15px] font-extrabold text-sky underline underline-offset-4 min-h-8">Use my email instead</button>
          </>) : (<>
            <Q help="We send the story link there and keep it for you. Nothing else.">Where should we send the story?</Q>
            <input key="email" className="field text-xl" type="email" inputMode="email" autoComplete="email" autoFocus placeholder="e.g. mariam@gmail.com" value={d.email} onChange={(e) => u("email", e.target.value)} maxLength={120} enterKeyHint="next" />
            <button type="button" onClick={() => { put({ byPhone: true }); setErr(null); }} className="self-start text-[15px] font-extrabold text-sky underline underline-offset-4 min-h-8">No email? Use your WhatsApp number instead</button>
          </>)}
        </>)}

        {step === "review" && (<>
          <Q help="Tap any part to change it.">Does this look right?</Q>
          <p className="m-0 text-[19px] leading-8">
            <B onClick={() => goTo("name")}>{name}</B>, <B onClick={() => goTo("age")}>{d.age}</B>.
            {uses("other") && <> {bullied ? "The unkind child is called" : `Joining ${him} in the story:`} <B onClick={() => goTo("other")}>{otherName(d)}</B>.</>}
            {uses("sidekick") && <> {His} robot friend is called <B onClick={() => goTo("sidekick")}>{cap(d.sidekick.trim() || FORM_DEFAULTS.sidekick)}</B>.</>}
            {uses("power_word") && <> When {he} wants to feel strong {he} says <B onClick={() => goTo("power_word")}>"{bang(d.power_word)}"</B>.</>}
            {uses("need") && d.need && <> When {he}'s upset, {he} says <B onClick={() => goTo("need")}>&ldquo;{d.need}&rdquo;</B></>}
            {d.silly && <> Silly word: <B onClick={() => goTo("silly")}>{d.silly}</B>!</>}
          </p>
          <p className="m-0 text-[15px] text-ink-soft">{d.byPhone ? "Your WhatsApp number" : "We'll send it to"} <B onClick={() => goTo("email")}>{d.byPhone ? d.phone.trim() : d.email.trim()}</B>{d.dedication.trim() ? <> with your message: <B onClick={() => goTo("dedication")}>"{d.dedication.trim()}"</B></> : null}.</p>
        </>)}

        {err && <p role="alert" className="m-0 text-sm font-bold text-danger">{err}</p>}
      </div>

      <div className="sticky bottom-0 bg-white border-t border-line px-4 py-3 flex flex-col gap-2">
        {step === "review" ? (
          <button type="submit" ref={nextRef} disabled={busy} className="btn-primary w-full !h-14 text-lg">{busy ? "Making the story…" : `Make ${name}'s story`}</button>
        ) : step === "dedication" || step === "silly" ? (
          <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => { u(step, ""); setErr(null); setI((x) => x + 1); }} className="btn-ghost w-full">Skip</button><button type="submit" ref={nextRef} className="btn-primary w-full">Next</button></div>
        ) : (
          <button type="submit" ref={nextRef} className="btn-primary w-full">Next</button>
        )}
        <span className="text-center text-xs font-bold text-ink-soft">No photo, no address.</span>
      </div>
      </form>
    </div>
  );
}

function CoverPreview({ slug, gender, title, name, inline }: { slug: string; gender: "boy" | "girl"; title: string; name: string; inline?: boolean }) {
  return (
    <div className={`${inline ? "" : "mx-4 mt-2"} relative w-[150px] aspect-[5/7] rounded-xl overflow-hidden shadow-[0_3px_0_var(--line)] self-start`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={storyImage(slug, gender, "cover.jpg")} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-x-2 top-2 text-center text-white drop-shadow-[0_1px_3px_rgba(0,0,0,.7)]">
        <span className="block text-[7px] font-extrabold tracking-[2px] uppercase text-[#ffd77a]">A GTales story</span>
        <span className="block display font-bold text-[13px] leading-[14px] mt-0.5">{title}</span>
      </div>
      <span className="absolute left-2 bottom-1.5 text-[8px] font-extrabold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,.7)]">Made for {name}</span>
    </div>
  );
}
/** Option chips from builder-options.json plus "✏️ Other…" (free text below). */
function OwnChips({ cards, value, own, onPick, onOwn }: { cards: BuilderCard[]; value: string; own: boolean; onPick: (v: string) => void; onOwn: () => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {cards.map((c) => <button key={c.value} type="button" aria-pressed={!own && value === c.value} onClick={() => onPick(c.value)} className={`chip ${!own && value === c.value ? "chip-on" : ""}`}>{c.label}</button>)}
      <button type="button" aria-pressed={own} onClick={onOwn} className={`chip ${own ? "chip-on" : ""}`}>{OTHER_LABEL}</button>
    </div>
  );
}
function B({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="font-extrabold text-sky underline decoration-2 underline-offset-4 min-h-8">{children}</button>;
}
function cap(s: string) {
  return s.trim().replace(/\s+/g, " ").split(" ").map((w) => w.split("-").map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p)).join("-")).join(" ");
}
function bang(s: string) { const t = s.trim(); return /[.!?]$/.test(t) ? t : `${t}!`; }
function stepFor(field: string | undefined): Step {
  switch (field) {
    case "slug": return "struggle"; case "name": return "name"; case "gender": return "gender"; case "age": return "age";
    case "other": case "other_relation": return "other"; case "sidekick": return "sidekick"; case "power_word": return "power_word"; case "need": return "need";
    case "dedication": return "dedication"; case "silly": return "silly"; default: return "email";
  }
}
const safeRef = source;
