"use client";
/**
 * Series order form — docs/SPEC.md §9 (12 screens). One question per screen, chips + free text,
 * optional fields say so, photos upload as picked, auto-saved, pre-filled from a free story.
 */
import { useEffect, useMemo, useState } from "react";
import { sessionId, source, track } from "@/lib/track";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { COPY, egp, egpOrFree, priceBreakdown, type Pricing } from "@/lib/gtales";
import { LaunchPrice } from "@/components/ui/LaunchPrice";
import { booksLabel } from "@/lib/orders";
import { Icon } from "@/components/ui/Icon";
import { Promises } from "@/components/ui/Promises";

export interface Prefill { name?: string; age?: number; gender?: "boy" | "girl"; struggle?: string; storyId?: string }

const KEY = "gtales.order-draft.v1";
type Step = "hero" | "struggles" | "world" | "dedication" | "activities" | "book1" | "book2" | "book3" | "delivery" | "review";

interface Person { who: string; name: string; description: string; photo_key: string }
interface Book { people: Person[]; setting: string }
interface Draft {
  name: string; age: number | 0; gender: "boy" | "girl" | ""; face: string; description: string;
  struggles: string[];
  favourites: string[]; worldText: string; wordsParent: string; wordsChild: string; nicknames: string;
  dedication: string; activities: string[];
  books: Book[];
  parentName: string; whatsapp: string; governorate: string; city: string; street: string; landmark: string; bestTime: string; promo: string;
  isGift: boolean; giftTo: string; giftMessage: string; hidePrice: boolean;
  quantity: number; // printed books, 1–100
}
const EMPTY: Draft = { name: "", age: 0, gender: "", face: "", description: "", struggles: [], favourites: [], worldText: "", wordsParent: "", wordsChild: "", nicknames: "", dedication: "", activities: [], books: [{ people: [], setting: "" }, { people: [], setting: "" }, { people: [], setting: "" }], parentName: "", whatsapp: "", governorate: "", city: "", street: "", landmark: "", bestTime: "", promo: "", isGift: false, giftTo: "", giftMessage: "", hidePrice: true, quantity: 3 };

const STRUGGLES = ["Tantrums", "Hitting", "Being bullied", "Sleeping in the dark", "Worries", "Lying", "Big feelings", "Sharing", "Making friends", "Shyness", "Screen time", "New school"];
const FAVES = ["Lego", "Cars", "Dinosaurs", "Football", "Dolls", "Koshari", "Pizza", "Mango", "The beach", "Teta's house", "Blue", "Pink", "Cats", "Horses"];
const ACTIVITIES = ["Mazes", "Puzzles", "Colouring", "Riddles", "Maths questions", "Spot the difference", "Breathing games", "Counting", "Drawing"];
const WHO = ["Mama", "Baba", "Grandma", "Grandpa", "Brother", "Sister", "Friend", "Toy or pet", "Someone else"];
const SETTINGS = ["Ramadan", "A birthday", "A Sahel trip", "First day of school", "Eid", "A trip to Alexandria"];
const GOVS = ["Cairo", "Giza", "Alexandria", "Qalyubia", "Dakahlia", "Sharqia", "Gharbia", "Monufia", "Beheira", "Other"];

const Q = ({ children, help }: { children: React.ReactNode; help?: string }) => (
  <div className="flex flex-col gap-1.5"><h1 className="text-[26px] leading-8 md:text-3xl font-bold">{children}</h1>{help && <p className="m-0 text-[15px] leading-[22px] text-ink-soft">{help}</p>}</div>
);
const Chip = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button type="button" aria-pressed={on} onClick={onClick} className={`chip ${on ? "chip-on" : ""}`}>{on && <Icon name="check" size={16} strokeWidth={3} />}{children}</button>
);
const F = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => (
  <label className="flex flex-col gap-1.5 font-bold text-[15px]">{label}{children}{hint && <span className="text-[12px] font-medium text-ink-soft">{hint}</span>}</label>
);

export function OrderForm({ prefill, pricing }: { prefill: Prefill; pricing: Pricing }) {
  const router = useRouter();
  const [d, setD] = useState<Draft>(EMPTY);
  const [i, setI] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const QTY = Math.min(100, Math.max(1, Math.floor(d.quantity) || 1)); // "Number of books" stepper
  const price = priceBreakdown(pricing, QTY);

  useEffect(() => {
    let base = { ...EMPTY }; // the launch price applies by itself: no code to type
    try { const raw = localStorage.getItem(KEY); if (raw) base = { ...EMPTY, ...(JSON.parse(raw) as { d: Draft }).d }; } catch {}
    if (prefill.name && !base.name) base = { ...base, name: prefill.name, age: prefill.age ?? base.age, gender: prefill.gender ?? base.gender, struggles: prefill.struggle && !base.struggles.length ? [prefill.struggle] : base.struggles };
    setD(base); setReady(true);
    track("order_started", { story_id: prefill.storyId });
  }, [prefill]);
  useEffect(() => { if (ready) try { localStorage.setItem(KEY, JSON.stringify({ d })); } catch {} }, [d, ready]);

  // Promo: checked on the server as it's typed (codes, limits and expiry live in Supabase), with the number once given
  const [quote, setQuote] = useState<PromoQuote | null>(null);
  useEffect(() => {
    const code = d.promo.trim().toUpperCase();
    if (!code) return; // an old quote never matches an empty code
    const ctl = new AbortController();
    const t = setTimeout(() => {
      const wa = /\d{10,}/.test(d.whatsapp.replace(/\D/g, "")) ? `&whatsapp=${encodeURIComponent(d.whatsapp)}` : "";
      fetch(`/api/promo?code=${encodeURIComponent(code)}&quantity=${QTY}${wa}`, { signal: ctl.signal }).then((r) => r.json()).then((j: PromoQuote) => setQuote({ ...j, code: j.ok ? j.code : code })).catch(() => {});
    }, 350);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [d.promo, d.whatsapp, QTY]);

  const u = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const toggle = (k: "favourites" | "activities", v: string) => setD((p) => ({ ...p, [k]: p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v] }));
  const name = d.name.trim() || "your child";
  const steps = useMemo<Step[]>(() => {
    const s: Step[] = ["hero", "struggles", "world", "dedication", "activities"];
    d.struggles.slice(0, 3).forEach((_, k) => s.push(`book${k + 1}` as Step));
    s.push("delivery", "review");
    return s;
  }, [d.struggles]);
  const step = steps[Math.min(i, steps.length - 1)];
  const total = steps.length - 1;
  const goTo = (s: Step) => { setErr(null); setI(Math.max(0, steps.indexOf(s))); };

  const valid = (s: Step): string | null => {
    switch (s) {
      case "hero": if (!d.name.trim()) return "Please write the hero's name."; if (!d.age) return "Please choose an age."; if (!d.gender) return "Boy or girl?"; return null;
      case "struggles": return d.struggles.length ? null : "Pick or write at least one.";
      case "delivery": {
        if (d.parentName.trim().length < 2) return "Your name, please.";
        if (!/^\+?[0-9 ]{10,16}$/.test(d.whatsapp.trim())) return "A WhatsApp number, like 010 1234 5678.";
        if (!d.governorate) return "Please choose a governorate.";
        if (d.city.trim().length < 2 || d.street.trim().length < 3) return "City and street, please.";
        if (d.isGift && d.giftTo.trim().length < 2) return "Who is the gift for? Please write their name.";
        return null;
      }
      default: return null;
    }
  };
  const next = () => { const e = valid(step); setErr(e); if (!e) setI((x) => Math.min(steps.length - 1, x + 1)); };
  const back = () => { setErr(null); setI((x) => Math.max(0, x - 1)); };

  const addStruggle = (v: string) => { const t = v.trim(); if (!t || d.struggles.includes(t) || d.struggles.length >= 3) return; u("struggles", [...d.struggles, t]); };
  const [struggleText, setStruggleText] = useState("");

  const upload = async (file: File): Promise<string | null> => {
    const fd = new FormData(); fd.append("file", file);
    const r = await fetch("/api/uploads", { method: "POST", body: fd }).catch(() => null);
    if (!r) { setErr("No connection. Check the internet and add the photo again."); return null; }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(j.message || "That photo didn't upload. Please try another."); return null; }
    return j.key as string;
  };

  const submit = async () => {
    for (const s of steps) { const e = valid(s); if (e) { goTo(s); return setErr(e); } }
    setBusy(true); setErr(null);
    const payload = {
      child: { name: cap(d.name), age: d.age, gender: d.gender, description: d.description.trim() || undefined }, photos: { face: d.face || undefined },
      books: d.struggles.slice(0, 3).map((st, k) => ({ struggle: st, people: d.books[k].people.filter((p) => p.name.trim()).map((p) => ({ who: p.who, name: cap(p.name), description: p.description.trim() || undefined, photo_key: p.photo_key || undefined })), setting: d.books[k].setting.trim() || undefined })),
      world: { favourites: d.favourites, notes: d.worldText.trim() || undefined },
      quantity: QTY,
      words: { parent: d.wordsParent.trim() || undefined, child: d.wordsChild.trim() || undefined, nicknames: d.nicknames.trim() || undefined },
      dedication: d.dedication.trim() || undefined, activities: d.activities,
      parent: { name: d.parentName.trim(), whatsapp: d.whatsapp.trim(), governorate: d.governorate, city: d.city.trim(), street: d.street.trim(), landmark: d.landmark.trim() || undefined, best_time: d.bestTime || undefined,
        gift: d.isGift ? { recipient: d.giftTo.trim(), message: d.giftMessage.trim() || undefined, hide_price: d.hidePrice } : undefined },
      promo_code: d.promo.trim() || undefined, free_story_id: prefill.storyId, ref: safeRef(), session_id: sessionId(), website: (document.getElementById("website") as HTMLInputElement | null)?.value || "",
    };
    let r: Response;
    try {
      r = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    } catch {
      setBusy(false);
      return setErr("No connection. Your answers are saved: check the internet and tap Confirm my order again.");
    }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setBusy(false); if (j.field === "promo" || String(j.field ?? "").startsWith("gift")) goTo("delivery"); return setErr(j.message || j.issues?.[0]?.message || "Something went wrong. Please try again."); }
    try { localStorage.removeItem(KEY); } catch {}
    router.push(`/order/${j.id}/confirmed`);
  };

  const bookIdx = step.startsWith("book") ? Number(step.slice(4)) - 1 : -1;
  const promoOk = !!quote?.ok && quote.code === d.promo.trim().toUpperCase();
  // a code is used only when it beats the launch price (the server applies the same rule)
  const codeWins = promoOk && quote!.total! < price.total;
  const unit = codeWins ? quote!.unit! : price.net;
  const delivery = codeWins ? quote!.delivery! : price.delivery;
  const orderTotal = unit * QTY + delivery;

  return (
    <div className="mx-auto max-w-xl w-full flex flex-col min-h-[calc(100dvh-64px)]">
      <div className="flex items-center gap-3 px-4 pt-3 pb-1">
        {i > 0 ? <button type="button" onClick={back} aria-label="Back" className="w-12 h-12 rounded-full grid place-items-center text-ink"><Icon name="chevron" className="rotate-90" size={26} strokeWidth={2.5} /></button>
          : <Link href="/" aria-label="Back" className="w-12 h-12 rounded-full grid place-items-center text-ink"><Icon name="chevron" className="rotate-90" size={26} strokeWidth={2.5} /></Link>}
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="flex justify-between eyebrow !text-ink-soft"><span>{step === "review" ? "Check and confirm" : `${i + 1} of ${total}`}</span><span className="!text-flame-deep">The Series</span></div>
          <div className="h-2 rounded-full bg-sky-soft overflow-hidden"><div className="h-full bg-sky rounded-full transition-all" style={{ width: `${Math.min(100, ((i + 1) / total) * 100)}%` }} /></div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 flex flex-col gap-4">
        <input id="website" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

        {step === "hero" && (<>
          <Q help={prefill.name ? "Filled in from the free story. Change anything." : "A few quick questions, then we start."}>The hero</Q>
          <p className="m-0 -mt-2 rounded-2xl bg-sun-soft px-4 py-3 text-[15px] leading-[22px] font-medium">You will get <b>three printed books</b>. Each one is about one thing that is hard for your child right now, with their face in every picture.</p>
          <LaunchPrice pricing={pricing} size="sm" />
          <F label="Name"><input className="field text-xl" placeholder="e.g. Adam" value={d.name} onChange={(e) => u("name", e.target.value)} maxLength={14} /></F>
          <div className="flex flex-col gap-1.5"><span className="font-bold text-[15px]">Age</span>
            <div className="flex flex-wrap gap-2">{[2, 3, 4, 5, 6, 7, 8, 9, 10].map((a) => <button key={a} type="button" aria-pressed={d.age === a} onClick={() => u("age", a)} className={`w-[52px] h-[52px] rounded-full border-[3px] display font-bold text-xl ${d.age === a ? "border-flame bg-flame-soft text-flame-deep" : "border-line bg-white"}`}>{a}</button>)}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">{(["boy", "girl"] as const).map((g) => <button key={g} type="button" aria-pressed={d.gender === g} onClick={() => u("gender", g)} className={`h-14 rounded-2xl border-[3px] font-bold text-lg ${d.gender === g ? "border-flame bg-flame-soft" : "border-line bg-white"}`}>{g === "boy" ? "Boy" : "Girl"}</button>)}</div>
          <PhotoField label={`A photo of ${name}'s face (optional)`} hint="Good light, facing the camera. You can also send it on WhatsApp later." value={d.face} onPick={async (f) => { const k = await upload(f); if (k) u("face", k); }} onClear={() => u("face", "")} />
          <F label={`Or describe ${name} (optional)`} hint="Hair, eyes, skin, glasses, anything that makes them them."><textarea className="field font-medium min-h-20" placeholder="e.g. curly brown hair, big brown eyes, always in his blue football shirt" value={d.description} onChange={(e) => u("description", e.target.value)} maxLength={300} /></F>
          {d.face && <p className="m-0 text-[12px] leading-4 text-ink-soft">I have permission to use this photo. It is used only to create the pictures and deleted when the books are delivered.</p>}
        </>)}

        {step === "struggles" && (<>
          <Q help="Up to three. Each one becomes a book. Tap a suggestion or write your own.">What's hard for {name} right now?</Q>
          <div className="flex flex-col gap-2">
            {d.struggles.map((s, k) => (
              <div key={s} className="flex items-center gap-2 rounded-2xl border-[3px] border-flame bg-flame-soft px-4 min-h-14 font-bold text-[17px]">
                <span className="w-7 h-7 rounded-full bg-flame text-white grid place-items-center text-sm shrink-0">{k + 1}</span><span className="flex-1">{s}</span>
                <button type="button" aria-label={`Remove ${s}`} onClick={() => u("struggles", d.struggles.filter((x) => x !== s))} className="w-10 h-10 grid place-items-center text-flame-deep"><Icon name="cross" size={18} strokeWidth={3} /></button>
              </div>
            ))}
          </div>
          {d.struggles.length < 3 && (<>
            <div className="flex flex-wrap gap-2">{STRUGGLES.filter((s) => !d.struggles.includes(s)).map((s) => <Chip key={s} on={false} onClick={() => addStruggle(s)}>{s}</Chip>)}</div>
            <div className="flex gap-2"><input className="field" placeholder="Or write it, e.g. scared of dogs" value={struggleText} onChange={(e) => setStruggleText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addStruggle(struggleText); setStruggleText(""); } }} maxLength={60} /><button type="button" onClick={() => { addStruggle(struggleText); setStruggleText(""); }} className="btn-secondary !px-4">Add</button></div>
          </>)}
          <p className="m-0 text-[13px] text-ink-soft">{d.struggles.length} of 3 books chosen.</p>
        </>)}

        {step === "world" && (<>
          <Q help="Favourite things and the words you use at home. They go into the pictures and the text.">{name}'s world</Q>
          <div className="flex flex-wrap gap-2">{FAVES.map((f) => <Chip key={f} on={d.favourites.includes(f)} onClick={() => toggle("favourites", f)}>{f}</Chip>)}</div>
          <input className="field" placeholder="More favourites, e.g. his red bike, Om Ali" value={d.worldText} onChange={(e) => u("worldText", e.target.value)} maxLength={300} />
          <F label={`Something you say to ${name}`}><input className="field font-medium" placeholder='e.g. "Habibi, deep breath"' value={d.wordsParent} onChange={(e) => u("wordsParent", e.target.value)} maxLength={120} /></F>
          <F label={`Something ${name} says`}><input className="field font-medium" placeholder='e.g. "I can do it myself!"' value={d.wordsChild} onChange={(e) => u("wordsChild", e.target.value)} maxLength={120} /></F>
          <F label="Family nicknames (optional)"><input className="field font-medium" placeholder="e.g. Doudi, Mimi" value={d.nicknames} onChange={(e) => u("nicknames", e.target.value)} maxLength={120} /></F>
        </>)}

        {step === "dedication" && (<>
          <Q help="Optional. It goes on the first page of every book.">A message for {name}</Q>
          <textarea className="field text-lg min-h-28" placeholder={`e.g. For ${name}, who builds the tallest towers. We love you. Mama & Baba`} value={d.dedication} onChange={(e) => u("dedication", e.target.value)} maxLength={200} />
          <span className="text-[12px] font-bold text-ink-soft text-right">{d.dedication.length} / 200</span>
        </>)}

        {step === "activities" && (<>
          <Q help="Pick any number. These become the play pages in the books.">What does {name} like to do?</Q>
          <div className="flex flex-wrap gap-2">{ACTIVITIES.map((a) => <Chip key={a} on={d.activities.includes(a)} onClick={() => toggle("activities", a)}>{a}</Chip>)}</div>
        </>)}

        {bookIdx >= 0 && (
          <BookScreen idx={bookIdx} struggle={d.struggles[bookIdx]} name={name} book={d.books[bookIdx]} onChange={(b) => { const books = d.books.map((x, k) => (k === bookIdx ? b : x)); u("books", books); }} upload={upload} />
        )}

        {step === "delivery" && (<>
          <Q help="We send every page to this WhatsApp number for your approval, then the books to this address.">Where do we send the books?</Q>
          <div className="flex flex-col gap-2 rounded-2xl border-[3px] border-line bg-white px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="quantity" className="font-bold text-[17px]">Number of books</label>
              <div className="flex items-center gap-2">
                <button type="button" aria-label="One book less" disabled={QTY <= 1} onClick={() => u("quantity", QTY - 1)} className="w-11 h-11 rounded-full border-[3px] border-line bg-white display font-bold text-2xl leading-none disabled:opacity-40">−</button>
                <input id="quantity" aria-label="Number of books" inputMode="numeric" className="w-14 h-11 rounded-xl border-[3px] border-line text-center display font-bold text-xl" value={d.quantity || ""} onChange={(e) => u("quantity", Math.min(100, Number(e.target.value.replace(/\D/g, "")) || 0))} onBlur={() => u("quantity", QTY)} />
                <button type="button" aria-label="One more book" disabled={QTY >= 100} onClick={() => u("quantity", QTY + 1)} className="w-11 h-11 rounded-full border-[3px] border-line bg-white display font-bold text-2xl leading-none disabled:opacity-40">+</button>
              </div>
            </div>
            <p data-qty-summary className="m-0 text-[15px] font-bold text-ink-soft">{orderTotal === 0 ? `${booksLabel(QTY)} · free with ${quote?.code ?? "your code"}` : `${QTY} book${QTY === 1 ? "" : "s"} × ${egp(unit)} = ${unit * QTY} + ${delivery} delivery = ${egp(orderTotal)}`}</p>
          </div>
          <label className="flex gap-3 items-center rounded-2xl border-[3px] border-line bg-white px-4 py-3 font-bold text-[17px]"><input type="checkbox" className="w-6 h-6 shrink-0 accent-[var(--flame)]" checked={d.isGift} onChange={(e) => u("isGift", e.target.checked)} />🎁 This is a gift</label>
          {d.isGift && (<div className="flex flex-col gap-4 rounded-2xl bg-surface-tint p-4">
            <F label="Recipient's name" hint="The person who receives the parcel."><input className="field font-medium" placeholder="e.g. Nour Hassan" value={d.giftTo} onChange={(e) => u("giftTo", e.target.value)} maxLength={60} /></F>
            <F label="Gift message (optional)" hint={`Printed on the first page. ${d.giftMessage.length} / 200`}><textarea className="field font-medium min-h-24" placeholder={`e.g. Happy birthday ${name}! Love, Auntie Mona`} value={d.giftMessage} onChange={(e) => u("giftMessage", e.target.value)} maxLength={200} /></F>
            <label className="flex gap-3 items-center text-[15px] font-bold"><input type="checkbox" className="w-5 h-5 shrink-0" checked={d.hidePrice} onChange={(e) => u("hidePrice", e.target.checked)} />Don&apos;t include the price</label>
          </div>)}
          <F label="Your name"><input className="field font-medium" value={d.parentName} onChange={(e) => u("parentName", e.target.value)} maxLength={60} /></F>
          <F label="WhatsApp number"><input className="field font-medium" inputMode="tel" placeholder="010 1234 5678" value={d.whatsapp} onChange={(e) => u("whatsapp", e.target.value)} maxLength={16} /></F>
          <div className="flex flex-col gap-1.5"><span className="font-bold text-[15px]">Governorate</span><div className="flex flex-wrap gap-2">{GOVS.map((g) => <Chip key={g} on={d.governorate === g} onClick={() => u("governorate", g)}>{g}</Chip>)}</div></div>
          <F label="City or area"><input className="field font-medium" placeholder="e.g. Maadi" value={d.city} onChange={(e) => u("city", e.target.value)} maxLength={60} /></F>
          <F label="Street and building"><input className="field font-medium" placeholder="e.g. 12 Road 9, building 4, flat 3" value={d.street} onChange={(e) => u("street", e.target.value)} maxLength={200} /></F>
          <F label="Landmark (optional)"><input className="field font-medium" placeholder="e.g. next to Seoudi" value={d.landmark} onChange={(e) => u("landmark", e.target.value)} maxLength={120} /></F>
          <div className="flex flex-col gap-1.5"><span className="font-bold text-[15px]">Best time to message you</span><div className="flex flex-wrap gap-2">{["Morning", "Afternoon", "Evening", "Any time"].map((t) => <Chip key={t} on={d.bestTime === t} onClick={() => u("bestTime", t)}>{t}</Chip>)}</div></div>
          <F label="Promo code" hint={!d.promo.trim() ? "Optional. The launch price is already applied." : promoOk ? (!codeWins ? "The launch price is already lower, so we keep it." : promoLine(quote!) === "Free" ? "Free: books and delivery." : promoLine(quote!) + " applied.") : quote && !quote.ok && quote.code === d.promo.trim().toUpperCase() ? quote.message : "Checking…"}><input className="field font-medium uppercase" value={d.promo} onChange={(e) => u("promo", e.target.value)} maxLength={30} /></F>
        </>)}

        {step === "review" && (<>
          <Q help="Tap Edit to change anything.">Does this look right?</Q>
          <Row label="The hero" onEdit={() => goTo("hero")}>{cap(d.name)}, {d.age}, {d.gender} · {d.face ? "face photo ✓" : d.description.trim() ? "described ✓" : "no photo yet"}</Row>
          {d.struggles.map((s, k) => <Row key={s} label={`Book ${k + 1}: ${s}`} onEdit={() => goTo(`book${k + 1}` as Step)}>{[d.books[k].people.filter((p) => p.name.trim()).map((p) => `${cap(p.name)} (${p.who})`).join(", "), d.books[k].setting.trim()].filter(Boolean).join(" · ") || "No extra details"}</Row>)}
          <Row label="World and words" onEdit={() => goTo("world")}>{[...d.favourites, d.worldText.trim(), d.wordsParent.trim(), d.wordsChild.trim()].filter(Boolean).join(" · ") || "—"}</Row>
          <Row label="Play pages" onEdit={() => goTo("activities")}>{d.activities.join(", ") || "We'll choose for you"}</Row>
          <Row label="Message" onEdit={() => goTo("dedication")}>{d.dedication.trim() || "None"}</Row>
          {d.isGift && <Row label="🎁 Gift" onEdit={() => goTo("delivery")}>For {d.giftTo.trim()}{d.giftMessage.trim() ? ` · "${d.giftMessage.trim()}"` : ""} · {d.hidePrice ? "no price in the parcel" : "price included"}</Row>}
          <Row label="Number of books" onEdit={() => goTo("delivery")}>{booksLabel(QTY)}</Row>
          <Row label="Delivery" onEdit={() => goTo("delivery")}>{d.parentName}, {d.whatsapp} · {d.street}, {d.city}, {d.governorate}</Row>
          <div className="rounded-2xl bg-surface-tint p-4 flex flex-col gap-2 text-[15px]">
            <LaunchPrice pricing={pricing} size="sm" />
            <div className="flex justify-between gap-3"><span>{booksLabel(QTY)} × {codeWins ? <>{egpOrFree(unit)} <span className="text-mint font-bold">({quote!.code} · {promoLine(quote!)})</span></> : egp(unit)}</span><b className="whitespace-nowrap">{egpOrFree(unit * QTY)}</b></div>
            <div className="flex justify-between gap-3"><span>Delivery, anywhere in Egypt (one per order)</span><b className="whitespace-nowrap">{egpOrFree(delivery)}</b></div>
            <div className="h-px bg-line" />
            <div className="flex justify-between items-center"><span className="font-bold">{orderTotal ? "Pay on delivery" : "To pay"}</span><b className="display text-[26px]">{egpOrFree(orderTotal)}</b></div>
          </div>
          <Promises variant="compact" />
        </>)}

        {err && <p role="alert" className="m-0 text-sm font-bold text-danger">{err}</p>}
      </div>

      <div className="sticky bottom-0 bg-white border-t border-line px-4 py-3 flex flex-col gap-2">
        {step === "review" ? <button type="button" onClick={submit} disabled={busy} className="btn-primary w-full !h-14 text-lg">{busy ? "Sending…" : "Confirm my order"}</button>
          : step === "dedication" ? <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => { setErr(null); setI((x) => x + 1); }} className="btn-ghost w-full">Skip</button><button type="button" onClick={next} className="btn-primary w-full">Next</button></div>
          : <button type="button" onClick={next} className="btn-primary w-full">Next</button>}
        {(step === "review" || step === "delivery") && <span className="text-center text-xs font-bold text-ink-soft">{step === "review" ? "Nothing to pay online." : orderTotal === 0 ? `Free with ${quote?.code ?? "your code"}` : `${QTY} × ${egp(unit)} + ${egp(delivery)} delivery = ${egp(orderTotal)} · pay on delivery`}</span>}
      </div>
    </div>
  );
}

function BookScreen({ idx, struggle, name, book, onChange, upload }: { idx: number; struggle: string; name: string; book: Book; onChange: (b: Book) => void; upload: (f: File) => Promise<string | null> }) {
  const [who, setWho] = useState<string>("");
  const add = (w: string) => { if (book.people.length >= 4) return; onChange({ ...book, people: [...book.people, { who: w, name: w === "Mama" || w === "Baba" || w === "Grandma" || w === "Grandpa" ? w : "", description: "", photo_key: "" }] }); setWho(""); };
  const setP = (k: number, p: Partial<Person>) => onChange({ ...book, people: book.people.map((x, j) => (j === k ? { ...x, ...p } : x)) });
  return (<>
    <Q help="Optional. Leave it empty and our team decides.">Book {idx + 1}: {struggle}</Q>
    <div className="flex flex-col gap-2">
      <span className="font-bold text-[15px]">Who is in this story? <span className="text-ink-soft font-medium">(none, or up to 4)</span></span>
      {book.people.map((p, k) => (
        <div key={k} className="rounded-2xl border-2 border-line p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between"><span className="pill bg-sky-soft text-sky">{p.who}</span><button type="button" aria-label="Remove" onClick={() => onChange({ ...book, people: book.people.filter((_, j) => j !== k) })} className="w-9 h-9 grid place-items-center text-ink-soft"><Icon name="cross" size={16} strokeWidth={3} /></button></div>
          <input className="field font-medium" placeholder="Name, e.g. Omar, Teta Nadia" value={p.name} onChange={(e) => setP(k, { name: e.target.value })} maxLength={20} />
          <PhotoField label="A photo (or describe them below)" value={p.photo_key} onPick={async (f) => { const key = await upload(f); if (key) setP(k, { photo_key: key }); }} onClear={() => setP(k, { photo_key: "" })} compact />
          <input className="field font-medium" placeholder="e.g. curly hair, glasses, always in a red cap" value={p.description} onChange={(e) => setP(k, { description: e.target.value })} maxLength={200} />
        </div>
      ))}
      {book.people.length < 4 && <div className="flex flex-wrap gap-2">{WHO.map((w) => <Chip key={w} on={who === w} onClick={() => add(w)}>+ {w}</Chip>)}</div>}
    </div>
    <div className="flex flex-col gap-2">
      <span className="font-bold text-[15px]">What special moment happens in it? <span className="text-ink-soft font-medium">(optional)</span></span>
      <div className="flex flex-wrap gap-2">{SETTINGS.map((s) => <Chip key={s} on={book.setting === s} onClick={() => onChange({ ...book, setting: book.setting === s ? "" : s })}>{s}</Chip>)}</div>
      <input className="field font-medium" placeholder={`Or write it, e.g. ${name}'s first time on a plane`} value={book.setting} onChange={(e) => onChange({ ...book, setting: e.target.value })} maxLength={120} />
    </div>
  </>);
}

function PhotoField({ label, hint, value, onPick, onClear, required, compact }: { label: string; hint?: string; value: string; onPick: (f: File) => Promise<void>; onClear: () => void; required?: boolean; compact?: boolean }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-bold text-[15px]">{label}{required && <span className="text-flame"> *</span>}</span>
      {value ? (
        <div className={`flex items-center gap-3 rounded-2xl border-[3px] border-mint bg-mint-soft px-4 ${compact ? "min-h-12" : "min-h-14"}`}><Icon name="check" size={22} strokeWidth={3} className="text-mint" /><span className="font-bold flex-1">Photo added</span><button type="button" onClick={onClear} className="text-sm font-extrabold text-sky">Change</button></div>
      ) : (
        <label className={`flex items-center justify-center gap-2 rounded-2xl border-[3px] border-dashed border-sky bg-sky-soft font-extrabold text-sky cursor-pointer ${compact ? "min-h-12" : "min-h-14"}`}>
          <Icon name="person" size={22} />{busy ? "Uploading…" : "Choose a photo"}
          <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setBusy(true); await onPick(f); setBusy(false); e.target.value = ""; }} />
        </label>
      )}
      {hint && <span className="text-[12px] font-medium text-ink-soft">{hint}</span>}
    </div>
  );
}
function Row({ label, children, onEdit }: { label: string; children: React.ReactNode; onEdit: () => void }) {
  return (
    <div className="flex items-start gap-3 border-t border-line pt-3">
      <div className="flex-1 min-w-0"><span className="eyebrow !text-ink-soft">{label}</span><p className="m-0 text-[15px] leading-[22px] break-words">{children}</p></div>
      <button type="button" onClick={onEdit} className="text-sm font-extrabold text-sky min-h-10 px-2">Edit</button>
    </div>
  );
}
type PromoQuote = { ok: boolean; code?: string; message?: string; percent_off?: number; covers_delivery?: boolean; unit?: number; discount?: number; delivery?: number; total?: number };
function promoLine(q: PromoQuote) { return q.percent_off === 100 && q.covers_delivery ? "Free" : `${q.percent_off === 100 ? "books free" : `${q.percent_off}% off`}${q.covers_delivery ? " + free delivery" : ""}`; }
function cap(s: string) { return s.trim().replace(/\s+/g, " ").split(" ").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" "); }
const safeRef = source;
void COPY;
