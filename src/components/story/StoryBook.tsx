"use client";
import { KEEPERS, UNIVERSE } from "@/lib/keepers";
import type { StoryRecord } from "@/lib/types";
import type { ActivityId } from "@/lib/activities/registry";
import { Activity, type ActivityCtx } from "../activities/Activity";
import { KeeperAvatar } from "../KeeperAvatar";

function Page({ children, className = "", tone = "cream", print, color }: { children: React.ReactNode; className?: string; tone?: "cream" | "white" | "keeper"; print: boolean; color: string }) {
  return (
    <section
      className={`page ${print ? "w-[210mm] min-h-[297mm] p-[16mm] flex flex-col" : "card p-5 sm:p-8"} ${tone === "white" ? "bg-white" : tone === "keeper" ? "" : print ? "bg-cream" : ""} ${className}`}
      style={tone === "keeper" ? { background: `linear-gradient(160deg, ${color}22, #fff8ef 60%)` } : undefined}
    >
      {children}
    </section>
  );
}

interface Props {
  story: StoryRecord;
  mode: "web" | "print";
  variant?: "color" | "lineart";
}

/**
 * Renders the whole book as a sequence of "pages".
 *  web:   scrolling sections, interactive reveals, animated breathing star
 *  print: fixed A4 pages (one per .page) for the PDF renderer
 */
export function StoryBook({ story, mode, variant = "color" }: Props) {
  const a = story.assembled!;
  const lang = story.input.language;
  const ar = lang === "ar";
  const keeper = KEEPERS[a.keeper];
  const ctx: ActivityCtx = { story, mode, variant };
  const challenge = story.generated?.challenge ?? null;
  const challengeId = story.input.challengeType as ActivityId;
  const print = mode === "print";
  const img = variant === "lineart" ? story.lineart_url : story.cover_url;

  let textPageNo = 0;
  return (
    <div className={print ? "" : "space-y-5"} dir={ar ? "rtl" : "ltr"}>
      {a.pages.map((p, i) => {
        switch (p.kind) {
          case "cover":
            return (
              <Page key={i} print={print} color={keeper.color} tone="keeper" className={print ? "justify-center items-center text-center" : "text-center"}>
                <p className="text-xs font-bold tracking-widest uppercase text-ink-soft mb-2">Estoria · {UNIVERSE.keepers[lang]}</p>
                <h1 className="text-3xl sm:text-5xl font-bold text-ink mb-5 leading-tight">{p.title}</h1>
                {img && (
                  <div className="rounded-3xl overflow-hidden border-4 border-white shadow-lg mx-auto max-w-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="w-full block" />
                  </div>
                )}
                <p className="mt-5 text-ink-soft">
                  {ar ? `بطولة ${story.input.childName} · مع ${keeper.name.ar}، ${keeper.title.ar}` : `Starring ${story.input.childName} · with ${keeper.name.en}, ${keeper.title.en}`}
                </p>
              </Page>
            );
          case "text":
            textPageNo++;
            return (
              <Page key={i} print={print} color={keeper.color} tone={print ? (textPageNo % 2 ? "cream" : "white") : "cream"} className={print ? "justify-center" : ""}>
                <div className={`${print ? "text-[23px] leading-[1.9] my-auto" : "text-lg sm:text-xl leading-relaxed"} space-y-5 max-w-prose mx-auto w-full`}>
                  {p.paragraphs?.map((t, j) => <p key={j}>{t}</p>)}
                </div>
                {print && <div className="pt-8 text-center text-xs text-ink-soft">{textPageNo}</div>}
              </Page>
            );
          case "challenge":
            return (
              <Page key={i} print={print} color={keeper.color} tone="keeper">
                <div className="flex items-center gap-3 mb-4">
                  <KeeperAvatar id={a.keeper} size={56} mood="trouble" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">{ar ? "تحدي" : "Challenge"}</p>
                    <p className="font-bold text-indigo">{ar ? `${keeper.name.ar} محتاج مساعدتك يا ${story.input.childName}!` : `${keeper.name.en} needs your help, ${story.input.childName}!`}</p>
                  </div>
                </div>
                <Activity id={challengeId} ctx={ctx} challenge={challenge} />
              </Page>
            );
          case "activity":
            return (
              <Page key={i} print={print} color={keeper.color} tone="white">
                <p className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-3">{ar ? `ورشة ${keeper.name.ar}` : `${keeper.name.en}'s Workshop`}</p>
                <Activity id={p.activity as ActivityId} ctx={ctx} />
              </Page>
            );
          case "badge":
            return (
              <Page key={i} print={print} color={keeper.color} tone="keeper" className={print ? "justify-center" : ""}>
                <div className="mx-auto max-w-md text-center rounded-[2rem] border-4 border-dashed p-8 bg-white" style={{ borderColor: keeper.color }}>
                  <div className="mx-auto w-28 h-28 rounded-full flex items-center justify-center mb-3" style={{ background: `${keeper.color}22` }}>
                    <KeeperAvatar id={a.keeper} size={90} />
                  </div>
                  <p className="text-xs font-bold tracking-widest uppercase text-ink-soft">{ar ? "شهادة رسمية" : "Official certificate"}</p>
                  <h2 className="text-3xl font-bold text-ink my-2">{story.input.childName}</h2>
                  <p className="text-lg text-indigo font-bold">{ar ? `${UNIVERSE.helper.ar} لـ${keeper.name.ar}` : `${UNIVERSE.helper.en} of ${keeper.name.en}`}</p>
                  <p className="text-ink-soft">{keeper.title[lang]} · {UNIVERSE.land[lang]}</p>
                  <div className="mt-6 grid grid-cols-2 gap-6 text-xs text-ink-soft">
                    <div><div className="border-b-2 border-ink h-7" />{ar ? "توقيع الحارس" : "Keeper's signature"}</div>
                    <div><div className="border-b-2 border-ink h-7" />{ar ? "التاريخ" : "Date"}</div>
                  </div>
                </div>
              </Page>
            );
          case "parents":
            return (
              <Page key={i} print={print} color={keeper.color} tone="white">
                <h2 className="text-2xl font-bold text-indigo mb-2">{ar ? `إزاي تقرا القصة دي مع ${story.input.childName}` : `How to read this with ${story.input.childName}`}</h2>
                <ul className="list-disc ps-5 space-y-2 text-ink-soft mb-6">
                  <li>{ar ? "اقروا القصة مع بعض، وخلي طفلك هو اللي يحل التحدي بنفسه." : "Read it together, and let your child solve the challenge themselves."}</li>
                  <li>{ar ? `لما ${keeper.name.ar} يتغير، اسأل: "إيه اللي ساعده؟"` : `When ${keeper.name.en} changes, ask: "What helped?"`}</li>
                  <li>{ar ? "ارجعوا للورشة في يوم تاني — مش لازم كله في مرة واحدة." : "Come back to the Workshop on another day — it doesn't have to be all at once."}</li>
                </ul>
                <h3 className="font-bold mb-2">{ar ? "أسئلة للكلام بعد القصة" : "Questions to talk about afterwards"}</h3>
                <ol className="list-decimal ps-5 space-y-2">{story.generated?.parent_tips?.map((q, j) => <li key={j}>{q}</li>)}</ol>
                {story.input.struggle === "other" && (
                  <p className="mt-6 text-sm rounded-xl bg-coral-soft text-coral-dark p-3">{ar ? "القصة دي اتكتبت بالذكاء الاصطناعي من وصفك." : "This story was written by AI from your description."}</p>
                )}
                <p className="mt-auto pt-8 text-xs text-ink-soft text-center">estoria.kids</p>
              </Page>
            );
        }
      })}
    </div>
  );
}
