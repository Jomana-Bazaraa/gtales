"use client";
/**
 * GTales parent form — the form brief (docs/SPEC.md §7.2).
 * One question per screen, exact wording from the brief, only the fields the story `uses`,
 * live cover preview, review sentence, progress saved in the browser.
 */
import { useEffect, useMemo, useState } from "react";
import { sessionId, source, track } from "@/lib/track";
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

const KEY = "gtales.free-draft.v3";
type Step = "struggle" | "name" | "gender" | "age" | "place" | "other" | "sidekick" | "power_word" | "snack" | "silly" | "need" | "strength" | "dedication" | "email" | "review";

interface Draft {
  slug: string; name: string; gender: "boy" | "girl" | ""; age: number | 0; place: string;
  other: string; relation: "brother" | "sister" | "cousin" | ""; sidekick: string; power_word: string;
  need: string; strength: string; strengthOther: string; dedication: string; email: string; snack: string; silly: string;
}
const EMPTY: Draft = { slug: "", name: "", gender: "", age: 0, place: "", other: "", relation: "", sidekick: "", power_word: "", need: "", strength: "", strengthOther: "", dedication: "", email: "", snack: "", silly: "" };

const STRUGGLE_LABEL: Record<string, string> = { anger: "Anger and hitting", anxiety: "Fears and worries", bullied: "Being bullied", lying: "Lying", feelings: "Big feelings", friendship: "Friendship" };
// Story Builder cards: the team edits stories/builder-options.json, not this file.
type BuilderCard = { label: string; value: string };
const BUILDER = builderOptions as unknown as Record<"sidekick" | "power_word" | "snack" | "silly" | "need", BuilderCard[]>;
const OWN_SIDEKICK = "__parent_types__";
const plain = (label: string) => label.replace(/^[^A-Za-z0-9]+/, "").trim(); // "🤗 A hug" → "A hug"
const STRENGTHS: [string, string][] = [
  ["Drawing", "artist"], ["Football", "football player"], ["Building and Lego", "builder"], ["Swimming", "swimmer"], ["Dancing", "dancer"],
  ["Reading", "reader"], ["Singing", "singer"], ["Helping others", "helper"], ["Running", "runner"],
];
const LATIN = /^[A-Za-z][A-Za-z '\-]*$/;
const ARABIC = /[؀-ۿ]/;

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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const s = JSON.parse(raw) as { d: Draft; i: number }; setD({ ...EMPTY, ...s.d, slug: initialTale || s.d.slug }); setI(initialTale && s.i === 0 ? 1 : s.i); }
      else if (initialTale) setI(1);
    } catch {}
    setReady(true);
    track("story_started", { meta: initialTale ? { tale: initialTale } : undefined });
  }, [initialTale]);
  useEffect(() => { if (ready) try { localStorage.setItem(KEY, JSON.stringify({ d, i })); } catch {} }, [d, i, ready]);

  const u = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const meta = useMemo(() => metas.find((m) => m.slug === d.slug), [metas, d.slug]);
  const uses = (t: string) => !!meta && meta.uses.includes(t);
  const steps = useMemo<Step[]>(() => {
    const s: Step[] = ["struggle", "name", "gender", "age", "place"];
    if (uses("other")) s.push("other");
    if (uses("sidekick")) s.push("sidekick");
    if (uses("power_word")) s.push("power_word");
    if (uses("sidekick")) s.push("snack", "silly"); // optional; the fun lines need the robot
    if (uses("need")) s.push("need");
    if (uses("strength")) s.push("strength");
    s.push("dedication", "email", "review");
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta]);
  const step = steps[Math.min(i, steps.length - 1)];
  const total = meta ? steps.length - 1 : 12; // review is not counted; 12 until a story is chosen
  const name = d.name.trim() ? cap(d.name) : "your child";
  const he = d.gender === "girl" ? "she" : "he", his = d.gender === "girl" ? "her" : "his", He = d.gender === "girl" ? "She" : "He", His = d.gender === "girl" ? "Her" : "His";
  const bullied = meta?.other_rule === "not_sibling";
  const previewGender: "boy" | "girl" | null = !meta ? null : d.gender && meta.sets[d.gender] ? d.gender : meta.sets.boy ? "boy" : meta.sets.girl ? "girl" : null;
  const goTo = (s: Step) => { setErr(null); setI(steps.indexOf(s)); };

  const valid = (s: Step): string | null => {
    switch (s) {
      case "struggle": return d.slug ? (meta?.available ? null : "This story is coming soon. Please pick another one.") : "Please choose one.";
      case "name": { const n = d.name.trim(); if (!n) return "Please write your child's name."; if (ARABIC.test(n)) return "Please write the name in English letters, like Mariam."; if (n.length > 14) return "Up to 14 letters, please."; if (!LATIN.test(n)) return "English letters only, please."; return null; }
      case "gender": if (!d.gender) return "Please choose one."; if (meta && !meta.sets[d.gender]) return `The ${d.gender} pictures for this story are coming soon. Please choose another story for now.`; return null;
      case "age": return d.age ? null : "Please choose an age.";
      case "place": { const p = d.place.trim(); if (p.length < 2 || p.length > 20) return "2 to 20 letters, please."; if (ARABIC.test(p)) return "Please write it in English letters, like Maadi."; return null; }
      case "other": { const o = d.other.trim(); if (!o) return "Please write a name."; if (ARABIC.test(o)) return "Please write the name in English letters."; if (o.length > 14 || !LATIN.test(o)) return "Up to 14 English letters, please."; return null; }
      case "sidekick": { const s2 = d.sidekick.trim(); if (s2 && (s2.length > 12 || ARABIC.test(s2))) return "Up to 12 English letters, please."; return null; }
      case "power_word": { const p = d.power_word.trim(); if (p.length < 2 || p.length > 24) return "2 to 24 characters, please."; return null; }
      case "need": return d.need ? null : "Please choose one.";
      case "strength": return d.strength === "other" ? (d.strengthOther.trim().length >= 2 ? null : "Write one or two words, like chess player.") : d.strength ? null : "Please choose one.";
      case "dedication": return d.dedication.length > 120 ? "Up to 120 characters, please." : null;
      case "email": return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email.trim()) ? null : "Please write an email address.";
      default: return null;
    }
  };
  const next = () => { const e = valid(step); setErr(e); if (!e) setI((x) => Math.min(steps.length - 1, x + 1)); };
  const back = () => { setErr(null); setI((x) => Math.max(0, x - 1)); };

  const values = () => ({
    slug: d.slug, name: cap(d.name), gender: d.gender || "boy", age: d.age || 6, place: d.place.trim(),
    other: uses("other") ? cap(d.other) : undefined, other_relation: uses("other") ? (bullied ? "school" : d.relation || undefined) : undefined,
    sidekick: uses("sidekick") ? cap(d.sidekick.trim() || "Bolt") : undefined,
    power_word: uses("power_word") ? bang(d.power_word) : undefined,
    need: uses("need") ? d.need : undefined,
    snack: d.snack || undefined,
    silly: d.silly || undefined,
    strength: uses("strength") ? (d.strength === "other" ? d.strengthOther.trim().toLowerCase() : d.strength) : undefined,
    dedication: d.dedication.trim() || undefined, parent_name: d.email.split("@")[0], contact: d.email.trim(),
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

  const strengthLabel = d.strength === "other" ? d.strengthOther.trim().toLowerCase() : d.strength;

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
          <input className="field text-xl" autoFocus placeholder="e.g. Adam, Jana, Yassin" value={d.name} onChange={(e) => u("name", e.target.value)} maxLength={14} />
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

        {step === "place" && (<>
          <Q help="Your area or city. It will appear in the story.">Where do you live?</Q>
          <input className="field text-xl" autoFocus placeholder="e.g. Maadi, Zamalek, Smouha, Sheikh Zayed" value={d.place} onChange={(e) => u("place", e.target.value)} maxLength={20} />
        </>)}

        {step === "other" && (bullied ? (<>
          <Q help="You can use a made-up name. It does not have to be the real child.">What name should we use for the child who is unkind?</Q>
          <input className="field text-xl" autoFocus placeholder="e.g. Sam" value={d.other || "Sam"} onChange={(e) => u("other", e.target.value)} maxLength={14} />
        </>) : (<>
          <Q>Who is often with your child at home?</Q>
          <div className="flex gap-2">
            {(["brother", "sister", "cousin"] as const).map((r) => <button key={r} type="button" aria-pressed={d.relation === r} onClick={() => u("relation", r)} className={`chip ${d.relation === r ? "chip-on" : ""}`}>{r[0].toUpperCase() + r.slice(1)}</button>)}
          </div>
          <input className="field text-xl" autoFocus placeholder={`e.g. ${his} ${d.relation || "brother"} Omar`} value={d.other} onChange={(e) => u("other", e.target.value)} maxLength={14} />
          <p className="m-0 text-[13px] text-ink-soft">Just the name, e.g. Omar, Lina, Yousef.</p>
        </>))}

        {step === "sidekick" && (<>
          <Q help="In the story, a little robot friend will have this name.">What should the robot friend be called?</Q>
          <div className="flex flex-wrap gap-2">{BUILDER.sidekick.filter((c) => c.value !== OWN_SIDEKICK).map((c) => <button key={c.value} type="button" aria-pressed={d.sidekick === c.value} onClick={() => u("sidekick", c.value)} className={`chip ${d.sidekick === c.value ? "chip-on" : ""}`}>{c.label}</button>)}</div>
          <input className="field text-xl" placeholder={plain(BUILDER.sidekick.find((c) => c.value === OWN_SIDEKICK)?.label ?? "Or write your own")} value={d.sidekick} onChange={(e) => u("sidekick", e.target.value)} maxLength={12} />
          <p className="m-0 text-[13px] text-ink-soft">Leave it empty and we'll call the robot Bolt.</p>
        </>)}

        {step === "power_word" && (<>
          <Q help="Your child will say this out loud in the story, at the brave moment.">What does your child say to feel strong or brave?</Q>
          <div className="flex flex-wrap gap-2">{BUILDER.power_word.map((c) => <button key={c.value} type="button" aria-pressed={d.power_word === c.value} onClick={() => u("power_word", c.value)} className={`chip ${d.power_word === c.value ? "chip-on" : ""}`}>{c.label}</button>)}</div>
          <input className="field text-xl" placeholder="Or write your own" value={d.power_word} onChange={(e) => u("power_word", e.target.value)} maxLength={24} />
        </>)}

        {step === "need" && (<>
          <Q>When your child is sad or in a bad mood, what helps most?</Q>
          <div className="flex flex-col gap-2.5">{BUILDER.need.map((c) => <Card key={c.value} on={d.need === c.value} onClick={() => u("need", c.value)}>{c.label}</Card>)}</div>
        </>)}

        {step === "snack" && (<>
          <Q help="Optional. It turns up in a funny line in the story.">What's your child's favourite snack?</Q>
          <div className="grid grid-cols-2 gap-2.5">{BUILDER.snack.map((c) => <Card key={c.value} on={d.snack === c.value} onClick={() => u("snack", c.value)}>{c.label}</Card>)}</div>
        </>)}

        {step === "silly" && (<>
          <Q help="Optional. The robot shouts it in the story.">Pick a silly word!</Q>
          <div className="grid grid-cols-2 gap-2.5">{BUILDER.silly.map((c) => <Card key={c.value} on={d.silly === c.value} onClick={() => u("silly", c.value)}>{c.label}</Card>)}</div>
        </>)}

        {step === "strength" && (<>
          <Q help={`The story ends with "Best ___ in ${d.place.trim() || "Maadi"}".`}>What is your child great at?</Q>
          <div className="grid grid-cols-2 gap-2.5">
            {STRENGTHS.map(([label, saved]) => <Card key={saved} on={d.strength === saved} onClick={() => u("strength", saved)}>{label}</Card>)}
            <Card on={d.strength === "other"} onClick={() => u("strength", "other")}>Something else</Card>
          </div>
          {d.strength === "other" && <input className="field text-xl" autoFocus placeholder="e.g. chess player" value={d.strengthOther} onChange={(e) => u("strengthOther", e.target.value)} maxLength={24} />}
        </>)}

        {step === "dedication" && (<>
          <Q help="Optional. It goes on the first page.">Would you like to add a message for {name}?</Q>
          <textarea className="field text-lg min-h-28" autoFocus placeholder={`e.g. For ${name}, who builds the tallest towers. We love you. Mama & Baba`} value={d.dedication} onChange={(e) => u("dedication", e.target.value)} maxLength={120} />
          <span className="text-[12px] font-bold text-ink-soft text-right">{d.dedication.length} / 120</span>
        </>)}

        {step === "email" && (<>
          <Q help="We send the story link there and keep it for you. Nothing else.">Where should we send the story?</Q>
          <input className="field text-xl" type="email" inputMode="email" autoFocus placeholder="e.g. mariam@gmail.com" value={d.email} onChange={(e) => u("email", e.target.value)} maxLength={120} />
        </>)}

        {step === "review" && (<>
          <Q help="Tap any part to change it.">Does this look right?</Q>
          <p className="m-0 text-[19px] leading-8">
            <B onClick={() => goTo("name")}>{name}</B>, <B onClick={() => goTo("age")}>{d.age}</B>, lives in <B onClick={() => goTo("place")}>{d.place.trim()}</B>.
            {uses("other") && <> {bullied ? "The unkind child is called" : `${His} ${d.relation || "friend"} is`} <B onClick={() => goTo("other")}>{cap(d.other)}</B>.</>}
            {uses("sidekick") && <> {His} robot friend is called <B onClick={() => goTo("sidekick")}>{cap(d.sidekick.trim() || "Bolt")}</B>.</>}
            {uses("power_word") && <> When {he} wants to feel strong {he} says <B onClick={() => goTo("power_word")}>"{bang(d.power_word)}"</B>.</>}
            {uses("need") && d.need && <> When {he}'s upset, {he} says <B onClick={() => goTo("need")}>&ldquo;{d.need}&rdquo;</B></>}
            {d.snack && <> Favourite snack: <B onClick={() => goTo("snack")}>{d.snack}</B>.</>}
            {d.silly && <> Silly word: <B onClick={() => goTo("silly")}>{d.silly}</B>!</>}
            {uses("strength") && strengthLabel && <> {He}'s great at being a <B onClick={() => goTo("strength")}>{strengthLabel}</B>.</>}
          </p>
          <p className="m-0 text-[15px] text-ink-soft">We'll send it to <B onClick={() => goTo("email")}>{d.email.trim()}</B>{d.dedication.trim() ? <> with your message: <B onClick={() => goTo("dedication")}>"{d.dedication.trim()}"</B></> : null}.</p>
        </>)}

        {err && <p role="alert" className="m-0 text-sm font-bold text-danger">{err}</p>}
      </div>

      <div className="sticky bottom-0 bg-white border-t border-line px-4 py-3 flex flex-col gap-2">
        {step === "review" ? (
          <button type="button" onClick={submit} disabled={busy} className="btn-primary w-full !h-14 text-lg">{busy ? "Making the story…" : `Make ${name}'s story`}</button>
        ) : step === "dedication" || step === "snack" || step === "silly" ? (
          <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => { u(step, ""); setErr(null); setI((x) => x + 1); }} className="btn-ghost w-full">Skip</button><button type="button" onClick={next} className="btn-primary w-full">Next</button></div>
        ) : (
          <button type="button" onClick={next} className="btn-primary w-full">Next</button>
        )}
        <span className="text-center text-xs font-bold text-ink-soft">No photo, no phone number, no address.</span>
      </div>
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
function B({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="font-extrabold text-sky underline decoration-2 underline-offset-4 min-h-8">{children}</button>;
}
function cap(s: string) {
  return s.trim().replace(/\s+/g, " ").split(" ").map((w) => w.split("-").map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p)).join("-")).join(" ");
}
function bang(s: string) { const t = s.trim(); return /[.!?]$/.test(t) ? t : `${t}!`; }
function stepFor(field: string | undefined): Step {
  switch (field) {
    case "slug": return "struggle"; case "name": return "name"; case "gender": return "gender"; case "age": return "age"; case "place": return "place";
    case "other": case "other_relation": return "other"; case "sidekick": return "sidekick"; case "power_word": return "power_word"; case "need": return "need";
    case "strength": return "strength"; case "dedication": return "dedication"; case "snack": return "snack"; case "silly": return "silly"; default: return "email";
  }
}
const safeRef = source;
