"use client";
import { useState } from "react";
import { ACTIVITIES, ageBand, type ActivityId } from "@/lib/activities/registry";
import { dotsFor, generateMaze, generateWordSearch, hiddenObjects } from "@/lib/activities/generators";
import { KEEPERS } from "@/lib/keepers";
import type { AiChallenge, StoryRecord } from "@/lib/types";
import { BreathingStar, DotsSvg, DrawFrame, MazeSvg, Thermometer, WordSearchGrid, WritingLines } from "./Puzzles";

export interface ActivityCtx {
  story: StoryRecord;
  mode: "web" | "print";
  variant: "color" | "lineart";
}

const L = (ar: boolean, en: string, arS: string) => (ar ? arS : en);
const Title = ({ children }: { children: React.ReactNode }) => <h3 className="text-2xl font-bold text-indigo mb-1">{children}</h3>;
const Blurb = ({ children }: { children: React.ReactNode }) => <p className="text-ink-soft mb-4">{children}</p>;

/** Renders any workshop activity or the plot challenge. */
export function Activity({ id, ctx, challenge }: { id: ActivityId; ctx: ActivityCtx; challenge?: AiChallenge | null }) {
  const { story, mode } = ctx;
  const ar = story.input.language === "ar";
  const band = ageBand(story.input.age);
  const keeper = KEEPERS[story.keeper_id ?? "blaze"];
  const kname = keeper.name[story.input.language];
  const name = story.input.childName;
  const meta = ACTIVITIES[id];
  const web = mode === "web";

  switch (id) {
    case "maze": {
      const maze = generateMaze(story.id, band);
      return (
        <div>
          <Title>{L(ar, `${kname}'s maze`, `متاهة ${kname}`)}</Title>
          <Blurb>{L(ar, `Help ${kname} find the way. At every turn, take one slow breath.`, `ساعد ${kname} يلاقي الطريق. عند كل لفة، خد نفس واحد بالراحة.`)}</Blurb>
          <MazeSvg maze={maze} showSolution={false} />
          {web && <Reveal label={L(ar, "Show the way", "ورّيني الطريق")}><MazeSvg maze={maze} showSolution /></Reveal>}
        </div>
      );
    }
    case "wordsearch": {
      const ws = generateWordSearch(story.id, band, story.input.language, story.input.struggle);
      return (
        <div>
          <Title>{meta.label[story.input.language]}</Title>
          <Blurb>{meta.blurb[story.input.language]}</Blurb>
          <WordSearchGrid ws={ws} rtl={ar} />
          {web && <Reveal label={L(ar, "Show answers", "ورّيني الإجابات")}><WordSearchGrid ws={ws} rtl={ar} showSolution /></Reveal>}
        </div>
      );
    }
    case "dots": {
      const pts = dotsFor(story.keeper_id ?? "blaze", band);
      return (
        <div>
          <Title>{meta.label[story.input.language]}</Title>
          <Blurb>{L(ar, `Connect the dots in order to reveal ${kname}'s symbol.`, `وصّل النقط بالترتيب عشان تكشف رمز ${kname}.`)}</Blurb>
          <DotsSvg points={pts} />
          {web && <Reveal label={L(ar, "Reveal", "اكشف")}><DotsSvg points={pts} showLines /></Reveal>}
        </div>
      );
    }
    case "hidden_objects": {
      const items = hiddenObjects(story.id);
      const img = ctx.variant === "lineart" ? story.lineart_url : story.cover_url;
      return (
        <div>
          <Title>{meta.label[story.input.language]}</Title>
          <Blurb>{L(ar, "Find these 5 things hidden in the picture:", "دوّر على الـ٥ حاجات دول المستخبيين في الصورة:")} {items.map((i) => i.label[story.input.language]).join(ar ? "، " : ", ")}</Blurb>
          <div className="relative rounded-2xl overflow-hidden border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {img && <img src={img} alt="" className="w-full block" />}
            {items.map((it, i) => (
              <span key={i} className="absolute text-xl sm:text-2xl drop-shadow" style={{ left: `${it.x * 100}%`, top: `${it.y * 100}%`, transform: "translate(-50%,-50%)", opacity: ctx.variant === "lineart" ? 0.9 : 0.85 }} aria-hidden>
                {it.icon}
              </span>
            ))}
          </div>
        </div>
      );
    }
    case "coloring": {
      return (
        <div>
          <Title>{meta.label[story.input.language]}</Title>
          <Blurb>{L(ar, `Colour the scene. Tip: what colour is ${kname} when calm?`, `لوّن المشهد. تلميح: ${kname} لونه إيه لما يكون هادي؟`)}</Blurb>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {story.lineart_url && <img src={story.lineart_url} alt="" className="w-full rounded-2xl border border-line bg-white" />}
        </div>
      );
    }
    case "riddle":
    case "math": {
      if (!challenge) return null;
      return (
        <div>
          <Title>{challenge.title}</Title>
          <p className="text-lg leading-relaxed whitespace-pre-line mb-4">{challenge.prompt}</p>
          {challenge.hint && <p className="text-sm text-ink-soft mb-3">💡 {challenge.hint}</p>}
          {web ? (
            <Reveal label={L(ar, "Tap to reveal the answer", "دوس عشان تشوف الإجابة")}>
              <p className="text-xl font-bold text-coral">{challenge.answer}</p>
            </Reveal>
          ) : (
            <UpsideDown>{L(ar, "Answer: ", "الإجابة: ")}{challenge.answer}</UpsideDown>
          )}
        </div>
      );
    }
    case "choose_path": {
      if (!challenge) return null;
      return <ChoosePath c={challenge} web={web} ar={ar} />;
    }
    case "breathing_star":
      return (
        <div className="text-center">
          <Title>{meta.label[story.input.language]}</Title>
          <Blurb>{meta.blurb[story.input.language]}</Blurb>
          <BreathingStar animate={web} />
          <p className="text-sm text-ink-soft mt-2">{L(ar, "In for 4 · hold for 2 · out for 4. Five times around.", "شهيق ٤ · امسك ٢ · زفير ٤. خمس مرات حوالين النجمة.")}</p>
        </div>
      );
    case "feelings_thermometer":
      return (
        <div>
          <Title>{meta.label[story.input.language]}</Title>
          <Blurb>{meta.blurb[story.input.language]}</Blurb>
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-3 text-center"><Thermometer label={L(ar, "Before", "قبل")} color="#e8673f" /></div>
            <div className="card p-3 text-center"><Thermometer label={L(ar, "After the breath", "بعد النفس")} color="#5bb3f0" /></div>
          </div>
        </div>
      );
    case "calm_toolbox": {
      const cards = ar
        ? ["خد ٥ أنفاس بالراحة", "عد لـ١٠ بالعكس", "اشرب مية", "اعصر كورة طرية", "امشي لمكان هادي", "قول: أنا محتاج دقيقة"]
        : ["Take 5 slow breaths", "Count back from 10", "Drink some water", "Squeeze a soft ball", "Walk to a quiet spot", "Say: I need a minute"];
      return <CutoutCards title={meta.label[story.input.language]} blurb={meta.blurb[story.input.language]} cards={cards} />;
    }
    case "strong_words": {
      const cards = ar ? ["بس.", "مش عاجبني كده.", "ابعد عني.", "هقول لحد كبير.", "أنا مش لوحدي.", "أنا قوي."] : ["Stop.", "I don't like that.", "Leave me alone.", "I'm telling a grown-up.", "I'm not alone.", "I am strong."];
      return <CutoutCards title={meta.label[story.input.language]} blurb={meta.blurb[story.input.language]} cards={cards} />;
    }
    case "calm_tracker":
    case "brave_list":
    case "sharing_chart": {
      const days = ar ? ["السبت", "الأحد", "الاتنين", "التلات", "الأربع", "الخميس", "الجمعة"] : ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
      return (
        <div>
          <Title>{meta.label[story.input.language]}</Title>
          <Blurb>{meta.blurb[story.input.language]}</Blurb>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((d) => (
              <div key={d} className="text-center">
                <div className="text-[11px] font-bold text-ink-soft mb-1">{d}</div>
                <div className="aspect-square rounded-xl border-2 border-dashed border-line bg-white flex items-center justify-center text-xl text-line">☆</div>
              </div>
            ))}
          </div>
          {id === "sharing_chart" && <WritingLines n={2} />}
        </div>
      );
    }
    case "worry_jar":
      return (
        <div>
          <Title>{meta.label[story.input.language]}</Title>
          <Blurb>{meta.blurb[story.input.language]}</Blurb>
          <div className="grid grid-cols-[1fr_1.2fr] gap-4 items-center">
            <svg viewBox="0 0 120 160" className="w-full" direction="ltr"><rect x="30" y="8" width="60" height="18" rx="4" fill="#fff" stroke="#2a2320" strokeWidth="3" /><path d="M24 30 h72 v100 a12 12 0 0 1 -12 12 h-48 a12 12 0 0 1 -12 -12 z" fill="#d8f5f0" stroke="#2a2320" strokeWidth="3" /></svg>
            <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="rounded-xl border-2 border-dashed border-line bg-white h-14" />)}</div>
          </div>
        </div>
      );
    case "brave_ladder":
      return (
        <div>
          <Title>{meta.label[story.input.language]}</Title>
          <Blurb>{L(ar, "Bottom: a little scary. Top: the big brave thing. Fill the steps in between.", "تحت: حاجة مخوفة شوية. فوق: الحاجة الشجاعة الكبيرة. املا الدرجات اللي في النص.")}</Blurb>
          <div className="space-y-2">{[5, 4, 3, 2, 1].map((n) => <div key={n} className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-indigo-soft text-indigo font-bold flex items-center justify-center text-sm">{n}</span><div className="flex-1 border-b-2 border-dashed border-line h-8" /></div>)}</div>
        </div>
      );
    case "friendship_map":
    case "safe_people":
    case "memory_box":
      return (
        <div>
          <Title>{meta.label[story.input.language]}</Title>
          <Blurb>{meta.blurb[story.input.language]}</Blurb>
          <div className="grid grid-cols-2 gap-3">{[0, 1, 2, 3].slice(0, id === "memory_box" ? 4 : 3).map((i) => <div key={i}><DrawFrame /><div className="border-b-2 border-dashed border-line h-7 mt-1" /></div>)}{id !== "memory_box" && <div className="flex items-center justify-center text-5xl">{id === "safe_people" ? "🛡️" : "💛"}</div>}</div>
        </div>
      );
    case "face_match": {
      const faces = [["😊", L(ar, "happy", "فرحان")], ["😢", L(ar, "sad", "زعلان")], ["😠", L(ar, "angry", "غضبان")], ["😨", L(ar, "scared", "خايف")]];
      const shuffled = [...faces].sort((a, b) => a[1].localeCompare(b[1]));
      return (
        <div>
          <Title>{meta.label[story.input.language]}</Title>
          <Blurb>{meta.blurb[story.input.language]}</Blurb>
          <div className="grid grid-cols-[auto_1fr_auto] gap-y-4 items-center max-w-xs mx-auto">
            {faces.map(([f], i) => (
              <div key={i} className="contents"><span className="text-4xl">{f}</span><span className="border-b-2 border-dotted border-line mx-3" /><span className="font-bold text-lg">{shuffled[i][1]}</span></div>
            ))}
          </div>
        </div>
      );
    }
    case "peace_treaty":
    case "truth_pledge": {
      const isTreaty = id === "peace_treaty";
      return (
        <div className="card p-5 border-2 border-indigo/30">
          <Title>{meta.label[story.input.language]}</Title>
          <Blurb>{isTreaty ? L(ar, `We, ${name} and ${story.input.sidekick?.name ?? "____"}, agree to:`, `احنا، ${name} و${story.input.sidekick?.name ?? "____"}، متفقين على:`) : L(ar, `I, ${name}, promise myself: when it's hard, I will choose the truth — because the truth is lighter.`, `أنا، ${name}، بوعد نفسي: لما الموضوع يبقى صعب، هختار الصدق — عشان الصدق أخف.`)}</Blurb>
          <WritingLines n={3} />
          <div className="grid grid-cols-2 gap-6 mt-6 text-sm text-ink-soft">
            <div><div className="border-b-2 border-ink h-8" />{L(ar, "Signed", "التوقيع")}</div>
            <div><div className="border-b-2 border-ink h-8" />{isTreaty ? L(ar, "Signed", "التوقيع") : L(ar, "Witness: " + kname, "الشاهد: " + kname)}</div>
          </div>
        </div>
      );
    }
    case "truth_sort": {
      const items = ar ? ["عملت الواجب كله (وأنا معملتوش)", "كسرت الكوباية بالغلط", "القطة هي اللي أكلت الكيكة", "أنا زعلان عشان خسرت", "مكنتش أنا، كان أخويا"] : ["I finished all my homework (I hadn't)", "I broke the cup by accident", "The cat ate the cake", "I'm upset because I lost", "It wasn't me, it was my brother"];
      return (
        <div>
          <Title>{meta.label[story.input.language]}</Title>
          <Blurb>{L(ar, "Tick ✓ for truth, draw a tangle 🕸 for a tangle.", "علّم ✓ على الحقيقة، وارسم 🕸 على اللخبطة.")}</Blurb>
          <ul className="space-y-2">{items.map((it) => <li key={it} className="flex items-center gap-3 card px-3 py-2"><span className="w-8 h-8 rounded-lg border-2 border-line bg-white shrink-0" /><span>{it}</span></li>)}</ul>
        </div>
      );
    }
    case "superpowers_poster":
    case "stays_same_list":
      return (
        <div>
          <Title>{meta.label[story.input.language]}</Title>
          <Blurb>{meta.blurb[story.input.language]}</Blurb>
          <ol className="space-y-3 list-decimal ps-6 text-lg">{Array.from({ length: id === "superpowers_poster" ? 3 : 5 }, (_, i) => <li key={i}><div className="border-b-2 border-dashed border-line h-8" /></li>)}</ol>
        </div>
      );
    case "say_it_script":
      return (
        <div>
          <Title>{meta.label[story.input.language]}</Title>
          <Blurb>{meta.blurb[story.input.language]}</Blurb>
          {[0, 1, 2].map((i) => <p key={i} className="text-lg mt-4 leading-[2.4]">{L(ar, "I feel", "أنا حاسس بـ")} <span className="inline-block w-28 border-b-2 border-dashed border-ink align-bottom" /> {L(ar, "because", "عشان")} <span className="inline-block w-40 border-b-2 border-dashed border-ink align-bottom" />.</p>)}
        </div>
      );
    case "feelings_wheel": {
      const feels = ar ? ["فرحان", "زعلان", "غضبان", "خايف", "مكسوف", "فخور"] : ["Happy", "Sad", "Angry", "Scared", "Shy", "Proud"];
      return (
        <div className="text-center">
          <Title>{meta.label[story.input.language]}</Title>
          <Blurb>{meta.blurb[story.input.language]}</Blurb>
          <svg viewBox="-10 -10 320 320" className="w-64 mx-auto" direction="ltr">
            {feels.map((f, i) => {
              const a0 = (Math.PI * 2 * i) / 6 - Math.PI / 2, a1 = (Math.PI * 2 * (i + 1)) / 6 - Math.PI / 2;
              const x0 = 150 + 140 * Math.cos(a0), y0 = 150 + 140 * Math.sin(a0), x1 = 150 + 140 * Math.cos(a1), y1 = 150 + 140 * Math.sin(a1);
              const am = (a0 + a1) / 2;
              return <g key={f}><path d={`M150 150 L${x0} ${y0} A140 140 0 0 1 ${x1} ${y1} Z`} fill="#fff" stroke="#2a2320" strokeWidth="3" /><text x={150 + 90 * Math.cos(am)} y={150 + 90 * Math.sin(am) + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="#2b2d6b">{f}</text></g>;
            })}
          </svg>
        </div>
      );
    }
    case "draw_feeling":
    case "then_and_now":
      return (
        <div>
          <Title>{meta.label[story.input.language]}</Title>
          <Blurb>{meta.blurb[story.input.language]}</Blurb>
          {id === "then_and_now" ? <div className="grid grid-cols-2 gap-3"><div><p className="text-sm font-bold text-ink-soft mb-1">{L(ar, "Then", "زمان")}</p><DrawFrame /></div><div><p className="text-sm font-bold text-ink-soft mb-1">{L(ar, "Now", "دلوقتي")}</p><DrawFrame /></div></div> : <DrawFrame />}
        </div>
      );
    default:
      return null;
  }
}

function CutoutCards({ title, blurb, cards }: { title: string; blurb: string; cards: string[] }) {
  return (
    <div>
      <h3 className="text-2xl font-bold text-indigo mb-1">{title}</h3>
      <p className="text-ink-soft mb-4">{blurb} ✂️</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {cards.map((c) => (
          <div key={c} className="rounded-2xl border-2 border-dashed border-indigo/40 bg-white p-4 text-center font-bold text-indigo min-h-[88px] flex items-center justify-center">{c}</div>
        ))}
      </div>
    </div>
  );
}

function Reveal({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 no-print">
      {!open ? (
        <button onClick={() => setOpen(true)} className="btn-ghost w-full">{label}</button>
      ) : (
        <div className="rounded-2xl bg-cream-deep p-3">{children}</div>
      )}
    </div>
  );
}

function UpsideDown({ children }: { children: React.ReactNode }) {
  return <p className="mt-6 text-xs text-ink-soft rotate-180 text-center">{children}</p>;
}

function ChoosePath({ c, web, ar }: { c: AiChallenge; web: boolean; ar: boolean }) {
  const [pick, setPick] = useState<number | null>(null);
  const best = Number(c.answer);
  return (
    <div>
      <h3 className="text-2xl font-bold text-indigo mb-1">{c.title}</h3>
      <p className="text-lg mb-4">{c.prompt}</p>
      <ul className="space-y-2">
        {(c.options ?? []).map((o, i) => (
          <li key={i}>
            <button
              disabled={!web}
              onClick={() => setPick(i)}
              className={`w-full text-start card px-4 py-3 font-semibold transition ${pick === i ? (i === best ? "!border-teal !bg-teal-soft" : "!border-coral !bg-coral-soft") : ""}`}
            >
              <span className="inline-flex w-7 h-7 rounded-full bg-indigo-soft text-indigo items-center justify-center text-sm me-2">{String.fromCharCode(65 + i)}</span>
              {o}
            </button>
            {pick === i && c.outcomes?.[i] && <p className="px-4 py-2 text-ink-soft">{c.outcomes[i]} {i === best ? "✅" : "↩︎"}</p>}
          </li>
        ))}
      </ul>
      {!web && <UpsideDown>{ar ? "أحسن اختيار: " : "Best choice: "}{String.fromCharCode(65 + best)}</UpsideDown>}
    </div>
  );
}
