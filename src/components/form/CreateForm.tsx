"use client";
/**
 * Free story form — docs/SPEC.md §7. Eight steps, one question per screen,
 * auto-saved to localStorage, "No photo, no address."
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TALES, type Tale } from "@/lib/gtales";
import { challengeOptions, ageBand } from "@/lib/activities/registry";
import type { StoryInput } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";

const TOTAL = 8;
const KEY = "gtales.free-draft.v1";

interface Draft {
  tale: string; // slug
  childName: string;
  age: number;
  gender: "boy" | "girl";
  companion: string;
  place: string;
  placeChips: string[];
  food: string;
  foodChips: string[];
  sayToThem: string;
  theySay: string;
  goodAt: string[];
  goodAtOther: string;
  parentName: string;
  contact: string;
}

const EMPTY: Draft = {
  tale: "", childName: "", age: 6, gender: "boy", companion: "", place: "", placeChips: [], food: "", foodChips: [],
  sayToThem: "", theySay: "", goodAt: [], goodAtOther: "", parentName: "", contact: "",
};

const PLACES = ["The beach", "Teta's house", "The club", "The park", "Their bedroom", "The desert", "School"];
const FOODS = ["Koshari", "Pizza", "Molokhia", "Mango", "Chicken nuggets", "Pasta", "Ice cream"];
const GOOD_AT = ["Building", "Running fast", "Drawing", "Football", "Singing", "Making people laugh", "Helping at home", "Puzzles", "Swimming", "Being kind to animals"];

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

export function CreateForm({ initialTale }: { initialTale?: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [d, setD] = useState<Draft>({ ...EMPTY, tale: initialTale ?? "" });

  // restore / auto-save (SPEC §7)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { d: Draft; step: number };
        setD({ ...saved.d, tale: initialTale || saved.d.tale });
        setStep(initialTale && saved.step === 1 ? 2 : saved.step);
      } else if (initialTale) setStep(2);
    } catch {}
  }, [initialTale]);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ d, step })); } catch {}
  }, [d, step]);

  const u = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const toggle = (k: "placeChips" | "foodChips" | "goodAt", v: string) =>
    setD((p) => ({ ...p, [k]: p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v] }));
  const tale: Tale | undefined = useMemo(() => TALES.find((t) => t.slug === d.tale), [d.tale]);
  const name = d.childName.trim() || "your child";

  const valid = (s: number): string | null => {
    switch (s) {
      case 1: return d.tale ? null : "Pick a superpower to continue.";
      case 2: return d.childName.trim().length >= 2 ? null : "Please add the hero's name.";
      case 4: return d.place.trim() || d.placeChips.length ? null : "Pick a place or type one.";
      case 5: return d.food.trim() || d.foodChips.length ? null : "Pick a food or type one.";
      case 7: return d.goodAt.length || d.goodAtOther.trim() ? null : "Pick at least one thing.";
      case 8: {
        const c = d.contact.trim();
        const ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c) || /^\+?[0-9 ]{8,20}$/.test(c);
        return d.parentName.trim() && ok ? null : "Your first name and a WhatsApp number or email.";
      }
      default: return null;
    }
  };
  const next = () => { const e = valid(step); setErr(e); if (!e) setStep((s) => Math.min(TOTAL, s + 1)); };
  const back = () => { setErr(null); setStep((s) => Math.max(1, s - 1)); };

  const submit = async () => {
    const e = valid(8); if (e) return setErr(e);
    if (!tale) return setStep(1);
    setBusy(true); setErr(null);
    const place = [...d.placeChips, d.place.trim()].filter(Boolean).join(", ");
    const food = [...d.foodChips, d.food.trim()].filter(Boolean).join(", ");
    const goodAt = [...d.goodAt, d.goodAtOther.trim()].filter(Boolean);
    const contact = d.contact.trim();
    const isEmail = contact.includes("@");
    const band = ageBand(d.age);
    const challenges = challengeOptions(tale.key, band);
    const payload: StoryInput = {
      childName: d.childName.trim(),
      age: d.age,
      gender: d.gender,
      appearance: { skinTone: "medium", hairStyle: "short", hairColor: "dark_brown" },
      interests: goodAt.slice(0, 5),
      sidekick: d.companion.trim() ? { name: d.companion.trim(), relation: "friend" } : undefined,
      struggle: tale.key,
      challengeType: challenges[0] ?? "maze",
      vibe: "funny",
      personalDetail: `${name} loves ${place || "home"} and ${food || "a good meal"}.`,
      place, food,
      homeWords: { parent: d.sayToThem.trim() || undefined, child: d.theySay.trim() || undefined },
      parentName: d.parentName.trim(),
      parentEmail: isEmail ? contact : undefined,
      parentPhone: isEmail ? undefined : contact,
      language: "en",
      consent: true,
      website: (document.getElementById("website") as HTMLInputElement | null)?.value || "",
    };
    const r = await fetch("/api/stories", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setBusy(false);
      setErr(r.status === 429 ? "Please try again in a little while." : "Something went wrong. Please try again.");
      return;
    }
    try { localStorage.removeItem(KEY); } catch {}
    router.push(`/story/${j.id}/status`);
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
              {TALES.map((t) => (
                <button key={t.slug} type="button" aria-pressed={d.tale === t.slug} onClick={() => u("tale", t.slug)} className={`text-left rounded-2xl border-[3px] p-3.5 flex flex-col gap-1 transition ${d.tale === t.slug ? "border-flame bg-flame-soft" : "border-line bg-white"}`}>
                  <b className="display text-lg leading-[22px] font-bold">{t.title}</b>
                  <span className="text-[12px] leading-4 font-bold text-ink-soft">Helps with: {t.helps}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <Title hint="Use the name they like to be called. It appears on every page.">The hero's name</Title>
            <input className="field text-xl" autoFocus placeholder="e.g. Adam" value={d.childName} onChange={(e) => u("childName", e.target.value)} maxLength={30} />
            <div className="flex flex-col gap-2">
              <span className="font-bold">How old is {name}? <span className="text-flame text-xl">{d.age}</span></span>
              <input type="range" min={4} max={8} value={d.age} onChange={(e) => u("age", Number(e.target.value))} className="w-full accent-flame" aria-label="Age" />
              <div className="flex justify-between text-xs font-bold text-ink-soft"><span>4</span><span>8</span></div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {(["boy", "girl"] as const).map((g) => (
                <button key={g} type="button" aria-pressed={d.gender === g} onClick={() => u("gender", g)} className={`rounded-2xl border-[3px] p-4 text-center font-bold text-lg ${d.gender === g ? "border-flame bg-flame-soft" : "border-line bg-white"}`}>
                  {g === "boy" ? "Boy" : "Girl"}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <Title hint="A friend, sibling, cousin or pet who joins the adventure. Optional.">Who goes on adventures with {name}?</Title>
            <input className="field text-xl" autoFocus placeholder="e.g. Omar, or Fluffy the cat" value={d.companion} onChange={(e) => u("companion", e.target.value)} maxLength={30} />
          </>
        )}

        {step === 4 && (
          <>
            <Title hint="It becomes a place in the story.">A place {name} loves</Title>
            <div className="flex flex-wrap gap-2">{PLACES.map((p) => <Chip key={p} on={d.placeChips.includes(p)} onClick={() => toggle("placeChips", p)}>{p}</Chip>)}</div>
            <input className="field" placeholder="Or type one, e.g. the roof at Geddo's" value={d.place} onChange={(e) => u("place", e.target.value)} maxLength={60} />
          </>
        )}

        {step === 5 && (
          <>
            <Title hint="The hero's favourite food shows up too.">{name}'s favourite food</Title>
            <div className="flex flex-wrap gap-2">{FOODS.map((p) => <Chip key={p} on={d.foodChips.includes(p)} onClick={() => toggle("foodChips", p)}>{p}</Chip>)}</div>
            <input className="field" placeholder="Or type one" value={d.food} onChange={(e) => u("food", e.target.value)} maxLength={60} />
          </>
        )}

        {step === 6 && (
          <>
            <Title hint="The words you use at home make the story sound like your family. Optional.">Home words</Title>
            <label className="flex flex-col gap-1.5 font-bold text-[15px]">Something you say to {name}
              <input className="field font-medium" placeholder='e.g. "Habibi, deep breath"' value={d.sayToThem} onChange={(e) => u("sayToThem", e.target.value)} maxLength={120} />
            </label>
            <label className="flex flex-col gap-1.5 font-bold text-[15px]">Something {name} says
              <input className="field font-medium" placeholder='e.g. "I can do it myself!"' value={d.theySay} onChange={(e) => u("theySay", e.target.value)} maxLength={120} />
            </label>
          </>
        )}

        {step === 7 && (
          <>
            <Title hint="The hero wins with these strengths.">What is {name} good at?</Title>
            <div className="flex flex-wrap gap-2">{GOOD_AT.map((p) => <Chip key={p} on={d.goodAt.includes(p)} onClick={() => toggle("goodAt", p)}>{p}</Chip>)}</div>
            <input className="field" placeholder="Something else" value={d.goodAtOther} onChange={(e) => u("goodAtOther", e.target.value)} maxLength={40} />
          </>
        )}

        {step === 8 && (
          <>
            <Title hint="So we can save the story and the PDFs for you.">Last thing: where do we send it?</Title>
            <label className="flex flex-col gap-1.5 font-bold text-[15px]">Your first name
              <input className="field font-medium" placeholder="e.g. Ayman" value={d.parentName} onChange={(e) => u("parentName", e.target.value)} maxLength={60} />
            </label>
            <label className="flex flex-col gap-1.5 font-bold text-[15px]">WhatsApp number or email
              <input className="field font-medium" inputMode="email" placeholder="01x xxxx xxxx or you@email.com" value={d.contact} onChange={(e) => u("contact", e.target.value)} maxLength={120} />
            </label>
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
