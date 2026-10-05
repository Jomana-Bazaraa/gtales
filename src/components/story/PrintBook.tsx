"use client";
/**
 * Print layout for the PDF renderer: 20 × 20 cm square picture-book pages (standard trim).
 * Every page is exactly 200×200 mm. Illustrations fill the page; text sits in a band beneath.
 */
import { KEEPERS, UNIVERSE } from "@/lib/keepers";
import type { StoryRecord } from "@/lib/types";
import type { ActivityId } from "@/lib/activities/registry";
import { ACTIVITIES } from "@/lib/activities/registry";
import { Activity, type ActivityCtx } from "../activities/Activity";
import { KeeperAvatar } from "../KeeperAvatar";

const Sheet = ({ children, className = "", bg = "#ffffff" }: { children: React.ReactNode; className?: string; bg?: string }) => (
  <section className={`page relative overflow-hidden flex flex-col ${className}`} style={{ width: "200mm", height: "200mm", background: bg }}>
    {children}
  </section>
);

const Mark = ({ dark = false }: { dark?: boolean }) => (
  <span className={`inline-flex items-center gap-2 font-bold display ${dark ? "text-ink" : "text-coral"}`}>
    <svg width="22" height="22" viewBox="0 0 30 30" aria-hidden>
      <rect x="3" y="4" width="24" height="22" rx="6" fill="#e8673f" />
      <path d="M9 10h12M9 15h12M9 20h7" stroke="#fff8ef" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
    Estoria
  </span>
);

export function PrintBook({ story, variant = "color" }: { story: StoryRecord; variant?: "color" | "lineart" }) {
  const a = story.assembled!;
  const lang = story.input.language;
  const ar = lang === "ar";
  const keeper = KEEPERS[a.keeper];
  const name = story.input.childName;
  const ctx: ActivityCtx = { story, mode: "print", variant };
  const challenge = story.generated?.challenge ?? null;
  const challengeId = story.input.challengeType as ActivityId;
  const coverImg = variant === "lineart" ? story.lineart_url : story.cover_url;
  const year = new Date(story.created_at).getFullYear();
  const textPages = a.pages.filter((p) => p.kind === "text");
  const total = textPages.length;
  let n = 0;

  return (
    <div className="print-book" dir={ar ? "rtl" : "ltr"}>
      {/* ---- COVER ---- */}
      <Sheet bg="#fff8ef">
        {coverImg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-x-0 bottom-0 px-[14mm] pt-[16mm] pb-[12mm]" style={{ background: "linear-gradient(to top, rgba(255,248,239,0.97) 60%, rgba(255,248,239,0))" }}>
          <p className="text-[11pt] font-bold tracking-[0.25em] uppercase text-ink-soft mb-1">{UNIVERSE.keepers[lang]}</p>
          <h1 className="text-[32pt] leading-[1.05] font-bold text-ink max-w-[170mm]">{a.title}</h1>
          <p className="text-[12pt] text-ink-soft mt-2">{ar ? `بطولة ${name} · مع ${keeper.name.ar}، ${keeper.title.ar}` : `Starring ${name} · with ${keeper.name.en}, ${keeper.title.en}`}</p>
        </div>
        <div className="absolute top-[10mm] start-[14mm] bg-cream/90 rounded-full px-4 py-1.5 text-[13pt]"><Mark /></div>
      </Sheet>

      {/* ---- TITLE / COPYRIGHT PAGE ---- */}
      <Sheet bg="#fff8ef">
        <div className="flex-1 flex flex-col items-center justify-center text-center px-[20mm]">
          <KeeperAvatar id={a.keeper} size={100} />
          <h2 className="text-[24pt] font-bold text-ink mt-3">{a.title}</h2>
          <p className="text-[13pt] text-ink-soft mt-2">{ar ? `قصة من سلسلة الحُرّاس · اتعملت مخصوص لـ${name}` : `A Keepers story · made especially for ${name}`}</p>
          <div className="mt-8 w-[120mm] border-2 border-dashed border-line rounded-2xl p-4 text-[13pt] text-ink-soft">
            {ar ? "الكتاب ده بتاع:" : "This book belongs to:"}
            <div className="border-b-2 border-ink h-9 mt-2 mx-6" />
          </div>
        </div>
        <div className="px-[14mm] pb-[9mm] text-[8.5pt] leading-relaxed text-ink-soft text-center">
          <p>© {year} Estoria · estoria.kids · {ar ? "جميع الحقوق محفوظة." : "All rights reserved."} {ar ? "الحُرّاس وشخصياتهم علامات لإستوريا." : "The Keepers and their characters are trademarks of Estoria."}</p>
          <p>{ar ? `القصة والرسومات اتعملت بشكل شخصي لـ${name}. الرسومات أصلية ومعمولة من وصف مكتوب — مفيش أي صورة حقيقية اتستخدمت.` : `Story and illustrations personalised for ${name}. Illustrations are original artwork generated from a written description — no photograph was used.`}</p>
        </div>
      </Sheet>

      {/* ---- STORY PAGES ---- */}
      {a.pages.map((p, i) => {
        if (p.kind === "text") {
          n++;
          const img = p.imageUrl;
          const paras = p.paragraphs ?? [];
          const long = paras.join(" ").length > 330;
          return (
            <Sheet key={i} bg={n % 2 ? "#ffffff" : "#fff8ef"}>
              {img ? (
                <>
                  <div className="h-[122mm] w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className={`flex-1 flex items-center justify-center px-[14mm] pb-[6mm] ${ar ? "text-right" : "text-left"}`}>
                    <div className={`${long ? "text-[12.5pt] leading-[1.5]" : "text-[15pt] leading-[1.55]"} space-y-1.5 w-full`}>
                      {paras.map((t, j) => <p key={j}>{t}</p>)}
                    </div>
                  </div>
                </>
              ) : (
                <div className={`flex-1 flex items-center justify-center px-[20mm] ${ar ? "text-right" : "text-left"}`}>
                  <div className="text-[19pt] leading-[1.65] space-y-4 w-full">
                    {paras.map((t, j) => <p key={j}>{t}</p>)}
                  </div>
                </div>
              )}
              <div className="absolute bottom-[4.5mm] inset-x-0 text-center text-[8pt] text-ink-soft">{n} / {total}</div>
            </Sheet>
          );
        }
        if (p.kind === "challenge") {
          return (
            <Sheet key={i} bg="#ffffff">
              <ActivityPage ar={ar} eyebrow={ar ? `تحدي · ${keeper.name.ar} محتاج مساعدتك يا ${name}!` : `Challenge · ${keeper.name.en} needs your help, ${name}!`} keeper={a.keeper}>
                <Activity id={challengeId} ctx={ctx} challenge={challenge} />
              </ActivityPage>
            </Sheet>
          );
        }
        if (p.kind === "activity") {
          const meta = ACTIVITIES[p.activity as ActivityId];
          return (
            <Sheet key={i} bg="#ffffff">
              <ActivityPage ar={ar} eyebrow={ar ? `ورشة ${keeper.name.ar} · ${meta.label.ar}` : `${keeper.name.en}'s Workshop · ${meta.label.en}`} keeper={a.keeper}>
                <Activity id={p.activity as ActivityId} ctx={ctx} />
              </ActivityPage>
            </Sheet>
          );
        }
        if (p.kind === "badge") {
          return (
            <Sheet key={i} bg="#fff8ef">
              <div className="flex-1 m-[12mm] rounded-[10mm] border-[5px] border-dashed flex flex-col items-center justify-center text-center bg-white" style={{ borderColor: keeper.color }}>
                <p className="text-[11pt] font-bold tracking-[0.3em] uppercase text-ink-soft">{ar ? "شهادة رسمية" : "Official certificate"}</p>
                <div className="w-[32mm] h-[32mm] rounded-full flex items-center justify-center my-3" style={{ background: `${keeper.color}22` }}><KeeperAvatar id={a.keeper} size={100} /></div>
                <h2 className="text-[34pt] font-bold text-ink leading-none">{name}</h2>
                <p className="text-[18pt] text-indigo font-bold mt-3">{ar ? `${UNIVERSE.helper.ar} لـ${keeper.name.ar}` : `${UNIVERSE.helper.en} of ${keeper.name.en}`}</p>
                <p className="text-[13pt] text-ink-soft">{keeper.title[lang]} · {UNIVERSE.land[lang]}</p>
                <div className="mt-8 grid grid-cols-2 gap-[20mm] text-[10pt] text-ink-soft w-[140mm]">
                  <div><div className="border-b-2 border-ink h-8" />{ar ? "توقيع الحارس" : "Keeper's signature"}</div>
                  <div><div className="border-b-2 border-ink h-8" />{ar ? "التاريخ" : "Date"}</div>
                </div>
              </div>
            </Sheet>
          );
        }
        if (p.kind === "parents") {
          return (
            <Sheet key={i} bg="#ffffff">
              <div className="flex-1 flex flex-col gap-[6mm] p-[14mm]">
                <div>
                  <p className="text-[10pt] font-bold tracking-[0.25em] uppercase text-ink-soft mb-2">{ar ? "للأهل" : "For parents"}</p>
                  <h2 className="text-[20pt] font-bold text-indigo leading-tight mb-3">{ar ? `إزاي تقرا القصة دي مع ${name}` : `How to read this with ${name}`}</h2>
                  <ul className="list-disc ps-6 space-y-1.5 text-[12pt] leading-relaxed text-ink">
                    <li>{ar ? "اقروا القصة مع بعض، وخلي طفلك هو اللي يحل التحدي بنفسه." : "Read it together, and let your child solve the challenge themselves."}</li>
                    <li>{ar ? `لما ${keeper.name.ar} يتغير، اسأل: "إيه اللي ساعده؟"` : `When ${keeper.name.en} changes, ask: "What helped?"`}</li>
                    <li>{ar ? "ارجعوا للورشة في يوم تاني — مش لازم كله في مرة واحدة." : "Come back to the Workshop on another day — it doesn't have to be all at once."}</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-[14pt] font-bold mb-2">{ar ? "أسئلة للكلام بعد القصة" : "Questions to talk about afterwards"}</h3>
                  <ol className="list-decimal ps-6 space-y-1.5 text-[12pt] leading-relaxed">{story.generated?.parent_tips?.map((q, j) => <li key={j}>{q}</li>)}</ol>
                  {story.input.struggle === "other" && <p className="mt-6 text-[11pt] rounded-xl bg-coral-soft text-coral-dark p-3">{ar ? "القصة دي اتكتبت بالذكاء الاصطناعي من وصفك." : "This story was written by AI from your description."}</p>}
                </div>
              </div>
            </Sheet>
          );
        }
        return null;
      })}

      {/* ---- BACK COVER ---- */}
      <Sheet bg="#2b2d6b">
        <div className="flex-1 flex flex-col items-center justify-center text-center text-white px-[18mm]">
          <div className="w-[32mm] h-[32mm] rounded-full bg-white/90 flex items-center justify-center mb-6"><KeeperAvatar id={a.keeper} size={110} /></div>
          <p className="text-[17pt] font-bold leading-snug">{ar ? "قصص طفلك مش بس بيسمع فيها الحل — بيعيشه." : "Stories where your child doesn't just hear the solution — they live it."}</p>
          <p className="text-[11pt] text-white/70 mt-4">{ar ? `${keeper.name.ar} واحد من ${UNIVERSE.keepers.ar}: تسع شخصيات، كل واحد بيحرس إحساس، وكل واحد محتاج مساعدة طفلك.` : `${keeper.name.en} is one of ${UNIVERSE.keepers.en}: nine characters, each guarding one feeling, each needing your child's help.`}</p>
          <div className="mt-10 text-[16pt] font-bold display text-white">estoria.kids</div>
          <p className="text-[9pt] text-white/50 mt-2">© {year} Estoria</p>
        </div>
      </Sheet>
    </div>
  );
}

function ActivityPage({ children, eyebrow, ar, keeper }: { children: React.ReactNode; eyebrow: string; ar: boolean; keeper: keyof typeof KEEPERS }) {
  return (
    <div className="flex-1 flex flex-col p-[11mm] pb-[9mm] act">
      <div className={`hdr flex items-center gap-3 mb-2 ${ar ? "flex-row-reverse" : ""}`}>
        <KeeperAvatar id={keeper} size={44} />
        <p className="text-[10pt] font-bold tracking-[0.2em] uppercase text-ink-soft">{eyebrow}</p>
      </div>
      <div className="flex-1 min-h-0 flex flex-col body">{children}</div>
      <div className="absolute bottom-[6mm] inset-x-0 text-center text-[8pt] text-ink-soft">estoria.kids</div>
    </div>
  );
}
