"use client";
/**
 * Free story form — docs/SPEC.md §7.2. Eight steps, one question per screen,
 * auto-saved to localStorage, "No photo, no address."
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TALES } from "@/lib/gtales";
import { RELATIONS, STRENGTHS, type Relation } from "@/stories/schema";
import { Icon } from "@/components/ui/Icon";

export interface TaleMeta {
  slug: string;
  available: boolean;
  uses: string[];
  need_choices: string[];
  ask_choices: string[];
  other_rule: "not_sibling" | null;
}

const TOTAL = 8;
const KEY = "gtales.free-draft.v2";

interface Draft {
  slug: string;
  name: string;
  gender: "boy" | "girl";
  age: number;
  half: boolean;
  place: string;
  other: string;
  other_relation: Relation | "";
  strength: string;
  strengthOther: string;
  sidekick: string;
  power_word: string;
  need: string;
  ask: string;
  dedication: string;
  parent_name: string;
  contact: string;
}
const EMPTY: Draft = { slug: "", name: "", gender: "boy", age: 6, half: false, place: "", other: "", other_relation: "", strength: "", strengthOther: "", sidekick: "", power_word: "", need: "", ask: "", dedication: "", parent_name: "", contact: "" };

const REL_LABEL: Record<Relation, string> = { brother: "Brother", sister: "Sister", cousin: "Cousin", friend: "Friend", school: "A child at school", park: "A child at the park" };
const PLACES = ["Maadi", "Zamalek", "Nasr City", "Heliopolis", "Sheikh Zayed", "New Cairo", "Smouha", "Mansoura"];

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`chip ${on ? "chip-on" : ""}`}>
      {on && <Icon name="check" size={16} strokeWidth={3} />}{children}
    </button>
  );
}
function Title({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="text-[26px] leading-8 md:text-3xl font-bold">{children}</h1>
      {hint && <p className="m-0 text-[15px] leading-[22px] text-ink-soft">{hint}</p>}
    </div>
  );
}
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="flex flex-col gap-1.5 font-bold text-[15px]">{label}{children}</label>
);

export function CreateForm({ initialTale, metas }: { initialTale?: string; metas: TaleMeta[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [d, setD] = useState<Draft>({ ...EMPTY, slug: initialTale ?? "" });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { d: Draft; step: number };
        setD({ ...EMPTY, ...saved.d, slug: initialTale || saved.d.slug });
        setStep(initialTale && saved.step === 1 ? 2 : Math.min(TOTAL, Math.max(1, saved.step)));
      } else if (initialTale) setStep(2);
    } catch {}
    setReady(true);
  }, [initialTale]);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify({ d, step })); } catch {}
  }, [d, step, ready]);

  const u = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const meta = useMemo(() => metas.find((m) => m.slug === d.slug), [metas, d.slug]);
  const uses = (t: string) => !meta || meta.uses.includes(t);
  const needsStep7 = !!meta && (meta.uses.includes("need") || meta.uses.includes("ask"));
  const name = d.name.trim() ? cap(d.name) : "your child";
  const relations: Relation[] = meta?.other_rule === "not_sibling" ? ["school", "park", "cousin", "friend"] : ["brother", "sister", "cousin", "friend"];

  const valid = (s: number): string | null => {
    switch (s) {
      case 1: return d.slug ? (meta?.available === false ? "This tale is almost ready. Please pick another superpower for now." : null) : "Pick a superpower to continue.";
      case 2: {
        const n = d.name.trim();
        if (!n) return "Please add the hero's name.";
        if (n.length > 14) return "Up to 14 letters, please.";
        if (!/^[A-Za-z][A-Za-z '\-]*$/.test(n)) return "Letters, spaces and hyphens only.";
        return null;
      }
      case 3: { const p = d.place.trim(); return p.length >= 2 && p.length <= 20 ? null : "A neighbourhood or city, 2 to 20 letters."; }
      case 4: if (!uses("other")) return null; return d.other.trim() && d.other_relation ? (/^[A-Za-z][A-Za-z '\-]*$/.test(d.other.trim()) ? null : "Letters, spaces and hyphens only.") : "The other child's name and who they are.";
      case 5: if (!uses("strength")) return null; return d.strength === "other" ? (d.strengthOther.trim().length >= 2 ? null : "Type what they're great at (one word, like 'climber').") : d.strength ? null : "Pick one.";
      case 6: {
        if (uses("sidekick") && !(d.sidekick.trim().length >= 1 && d.sidekick.trim().length <= 12)) return "A sidekick name, up to 12 letters.";
        if (uses("power_word") && !(d.power_word.trim().length >= 1 && d.power_word.trim().length <= 20)) return "A Power Word, up to 20 letters.";
        return null;
      }
      case 7: if (!needsStep7) return null; return (uses("need") && !d.need) || (uses("ask") && !d.ask) ? "Pick one of each." : null;
      case 8: {
        const c = d.contact.trim();
        const ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c) || /^\+?[0-9 ]{8,20}$/.test(c);
        if (!d.parent_name.trim() || !ok) return "Your first name and a WhatsApp number or email.";
        return null;
      }
      default: return null;
    }
  };
  const next = () => {
    const e = valid(step); setErr(e); if (e) return;
    let s = step + 1;
    if (s === 7 && !needsStep7) s = 8;
    setStep(Math.min(TOTAL, s));
  };
  const back = () => { setErr(null); let s = step - 1; if (s === 7 && !needsStep7) s = 6; setStep(Math.max(1, s)); };

  const submit = async () => {
    const e = valid(8); if (e) return setErr(e);
    setBusy(true); setErr(null);
    const payload = {
      slug: d.slug, name: cap(d.name), gender: d.gender, age: d.age, half: d.half, place: d.place.trim(),
      other: uses("other") ? cap(d.other) : undefined, other_relation: uses("other") && d.other_relation ? d.other_relation : undefined,
      strength: uses("strength") ? (d.strength === "other" ? d.strengthOther.trim().toLowerCase() : d.strength) : undefined,
      sidekick: uses("sidekick") ? cap(d.sidekick) : undefined, power_word: uses("power_word") ? d.power_word.trim() : undefined,
      need: uses("need") ? d.need : undefined, ask: uses("ask") ? d.ask : undefined,
      parent_name: d.parent_name.trim(), contact: d.contact.trim(),
      ref: safeRef(), website: (document.getElementById("website") as HTMLInputElement | null)?.value || "",
    };
    const r = await fetch("/api/books", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setBusy(false);
      if (r.status === 429) return setErr("Please try again in a little while.");
      if (r.status === 422) { setStep(stepFor(j.field)); return setErr(j.message || "Please change that word."); }
      if (r.status === 404) { setStep(1); return setErr(j.message); }
      if (r.status === 400 && j.issues?.[0]) { setStep(stepFor(j.issues[0].path)); return setErr(j.issues[0].message); }
      return setErr("Something went wrong. Please try again.");
    }
    try { localStorage.removeItem(KEY); } catch {}
    router.push(`/story/${j.id}`);
  };

  return (
    <div className="mx-auto max-w-xl w-full flex flex-col min-h-[calc(100dvh-64px)]">
      <div className="flex items-center gap-3 px-4 pt-3 pb-1">
        {step > 1 ? (
          <button type="button" onClick={back} aria-label="Back" className="w-11 h-11 rounded-full grid place-items-center text-ink"><Icon name="chevron" className="rotate-90" size={24} strokeWidth={2.5} /></button>
        ) : (
          <Link href="/tales" aria-label="Back" className="w-11 h-11 rounded-full grid place-items-center text-ink"><Icon name="chevron" className="rotate-90" size={24} strokeWidth={2.5} /></Link>
        )}
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="flex justify-between eyebrow !text-ink-soft"><span>Step {step} of {TOTAL}</span><span className="!text-mint">Free story</span></div>
          <div className="h-2 rounded-full bg-sky-soft overflow-hidden"><div className="h-full bg-sky rounded-full transition-all" style={{ width: `${(step / TOTAL) * 100}%` }} /></div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 flex flex-col gap-5">
        <input id="website" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

        {step === 1 && (
          <>
            <Title hint="Every tale builds one strength. The story is ready in two minutes.">Which superpower should this story build?</Title>
            <div className="grid grid-cols-2 gap-2.5">
              {TALES.map((t) => {
                const m = metas.find((x) => x.slug === t.slug);
                const soon = m ? !m.available : true;
                return (
                  <button key={t.slug} type="button" aria-pressed={d.slug === t.slug} onClick={() => u("slug", t.slug)} className={`relative text-left rounded-2xl border-[3px] p-3.5 flex flex-col gap-1 transition ${d.slug === t.slug ? "border-flame bg-flame-soft" : "border-line bg-white"} ${soon ? "opacity-70" : ""}`}>
                    <b className="display text-lg leading-[22px] font-bold">{t.title}</b>
                    <span className="text-[12px] leading-4 font-bold text-ink-soft">Helps with: {t.helps}</span>
                    {soon && <span className="pill bg-sun-soft text-ink !text-[10px] self-start mt-1">Coming soon</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <Title hint="Use the name they like to be called. It appears on every page.">The hero's name</Title>
            <input className="field text-xl" autoFocus placeholder="e.g. Adam" value={d.name} onChange={(e) => u("name", e.target.value)} maxLength={14} />
            <div className="grid grid-cols-2 gap-2.5">
              {(["boy", "girl"] as const).map((g) => (
                <button key={g} type="button" aria-pressed={d.gender === g} onClick={() => u("gender", g)} className={`rounded-2xl border-[3px] p-4 text-center font-bold text-lg ${d.gender === g ? "border-flame bg-flame-soft" : "border-line bg-white"}`}>
                  {g === "boy" ? "Boy" : "Girl"}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-bold">How old is {name}? <span className="text-flame text-xl">{d.age}{d.half ? "½" : ""}</span></span>
              <input type="range" min={4} max={8} value={d.age} onChange={(e) => u("age", Number(e.target.value))} className="w-full accent-flame" aria-label="Age" />
              <div className="flex justify-between text-xs font-bold text-ink-soft"><span>4</span><span>8</span></div>
              <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={d.half} onChange={(e) => u("half", e.target.checked)} className="w-5 h-5 accent-sky" />…and a half</label>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <Title hint="A neighbourhood or city. It becomes where the story happens.">Where does {name} live?</Title>
            <div className="flex flex-wrap gap-2">{PLACES.map((p) => <Chip key={p} on={d.place === p} onClick={() => u("place", p)}>{p}</Chip>)}</div>
            <input className="field" placeholder="Or type it, e.g. Mohandessin" value={d.place} onChange={(e) => u("place", e.target.value)} maxLength={20} />
          </>
        )}

        {step === 4 && (
          <>
            <Title hint={meta?.other_rule === "not_sibling" ? "In this tale the other child is from school or the park." : "A brother, sister, cousin or friend who is in the story."}>Who else is in the story?</Title>
            <Field label="Their name"><input className="field font-medium" placeholder="e.g. Omar" value={d.other} onChange={(e) => u("other", e.target.value)} maxLength={14} /></Field>
            <div className="flex flex-wrap gap-2">{relations.map((r) => <Chip key={r} on={d.other_relation === r} onClick={() => u("other_relation", r)}>{REL_LABEL[r]}</Chip>)}</div>
          </>
        )}

        {step === 5 && (
          <>
            <Title hint={`It fits the sentence "the best ___ in ${d.place.trim() || "Maadi"}".`}>What is {name} great at?</Title>
            <div className="flex flex-wrap gap-2">
              {STRENGTHS.map((s) => <Chip key={s} on={d.strength === s} onClick={() => u("strength", s)}>{s[0].toUpperCase() + s.slice(1)}</Chip>)}
              <Chip on={d.strength === "other"} onClick={() => u("strength", "other")}>Something else</Chip>
            </div>
            {d.strength === "other" && <input className="field" autoFocus placeholder="One word, e.g. climber" value={d.strengthOther} onChange={(e) => u("strengthOther", e.target.value)} maxLength={24} />}
          </>
        )}

        {step === 6 && (
          <>
            <Title hint="Let your child choose these two. They are theirs.">{name} chooses</Title>
            {uses("sidekick") && <Field label="The sidekick's name"><input className="field font-medium" placeholder="e.g. Bolt, Zigzag, Fluffy" value={d.sidekick} onChange={(e) => u("sidekick", e.target.value)} maxLength={12} /></Field>}
            {uses("power_word") && <Field label="The Power Word"><input className="field font-medium" placeholder="e.g. Blue Calm" value={d.power_word} onChange={(e) => u("power_word", e.target.value)} maxLength={20} /></Field>}
          </>
        )}

        {step === 7 && needsStep7 && (
          <>
            <Title hint="These are the words the hero says when it gets hard.">What would {name} say?</Title>
            {uses("need") && meta && (
              <div className="flex flex-col gap-2"><span className="font-bold text-[15px]">What {name} needs</span>
                <div className="flex flex-wrap gap-2">{meta.need_choices.map((c) => <Chip key={c} on={d.need === c} onClick={() => u("need", c)}>{c}</Chip>)}</div>
              </div>
            )}
            {uses("ask") && meta && (
              <div className="flex flex-col gap-2"><span className="font-bold text-[15px]">What {name} asks for</span>
                <div className="flex flex-wrap gap-2">{meta.ask_choices.map((c) => <Chip key={c} on={d.ask === c} onClick={() => u("ask", c)}>{c}</Chip>)}</div>
              </div>
            )}
          </>
        )}

        {step === 8 && (
          <>
            <Title hint="So we can save the story and the PDF for you.">Last thing: where do we send it?</Title>
            <Field label="Your first name"><input className="field font-medium" placeholder="e.g. Ayman" value={d.parent_name} onChange={(e) => u("parent_name", e.target.value)} maxLength={60} /></Field>
            <Field label="WhatsApp number or email"><input className="field font-medium" inputMode="email" placeholder="01x xxxx xxxx or you@email.com" value={d.contact} onChange={(e) => u("contact", e.target.value)} maxLength={120} /></Field>
            <p className="m-0 text-[13px] leading-[18px] text-ink-soft">We use it only to send this story and to save your stories. No spam.</p>
          </>
        )}

        {err && <p role="alert" className="m-0 text-sm font-bold text-danger">{err}</p>}
      </div>

      <div className="sticky bottom-0 bg-white border-t border-line px-4 py-3 flex flex-col gap-2">
        {step < TOTAL ? (
          <button type="button" onClick={next} className="btn-primary w-full">Next</button>
        ) : (
          <button type="button" onClick={submit} disabled={busy} className="btn-primary w-full">{busy ? "Making the story…" : "Make the story"}</button>
        )}
        <span className="text-center text-xs font-bold text-ink-soft">No photo, no address.</span>
      </div>
    </div>
  );
}

function cap(s: string) {
  return s.trim().replace(/\s+/g, " ").split(" ").map((w) => w.split("-").map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p)).join("-")).join(" ");
}
function stepFor(field: string | undefined): number {
  switch (field) {
    case "slug": return 1;
    case "name": case "age": case "gender": return 2;
    case "place": return 3;
    case "other": case "other_relation": return 4;
    case "strength": return 5;
    case "sidekick": case "power_word": return 6;
    case "need": case "ask": return 7;
    default: return 8;
  }
}
function safeRef(): string | undefined {
  try {
    const r = new URLSearchParams(location.search).get("ref") || localStorage.getItem("gtales.ref") || undefined;
    if (r) localStorage.setItem("gtales.ref", r);
    return r ? r.replace(/[^a-z0-9_-]/gi, "").slice(0, 60) : undefined;
  } catch { return undefined; }
}
