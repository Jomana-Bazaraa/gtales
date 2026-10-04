/** The static landing-page sample story: Adam, 6, football, anger → Blaze. Built from the real template, never from AI at runtime. */
import { assemblePages, loadTemplate, substitute, type SubstitutionContext } from "./template-engine";
import type { AssembledStory, GeneratedText, Lang, StoryRecord } from "./types";

const interest: Record<Lang, GeneratedText["interest_phrases"]> = {
  en: { world: "the world of football", place: "the football pitch behind the house", object: "his favourite football", activity: "practising penalties" },
  ar: { world: "عالم الكورة", place: "ملعب الكورة اللي ورا البيت", object: "كورته المفضلة", activity: "بيتمرن على ضربات الجزاء" },
};
const personal: Record<Lang, string> = {
  en: "Sometimes, when his little brother Omar touched his cards, Adam felt the hot thing too — and before he knew it, he'd shouted \"That's not fair!\" loud enough for the whole house to hear.",
  ar: "ساعات، لما أخوه الصغير عمر يلمس كروته، آدم كان بيحس بالسخونة دي برضه — وقبل ما يحس بنفسه، يلاقي نفسه صرخ \"مش عدل!\" بصوت البيت كله يسمعه.",
};
const tips: Record<Lang, string[]> = {
  en: ["What made Blaze's flame turn red?", "Adam, when do you feel the hot thing?", "What did Blaze do at every turn of the maze?", "Can we try one Cool Pond breath together right now?"],
  ar: ["إيه اللي خلى نار حامي تبقى حمرا؟", "آدم، إنت بتحس بالسخونة دي إمتى؟", "حامي كان بيعمل إيه عند كل لفة في المتاهة؟", "ممكن نجرب نفس واحد من البركة الباردة مع بعض دلوقتي؟"],
};

export async function showcaseStory(lang: Lang): Promise<StoryRecord> {
  const tpl = await loadTemplate("blaze-anger", lang);
  const ctx: SubstitutionContext = { childName: lang === "ar" ? "آدم" : "Adam", gender: "boy", keeper: "blaze", lang, sidekick: lang === "ar" ? "عمر" : "Omar", interest: interest[lang], personalDetail: personal[lang] };
  const workshop = ["breathing_star", "feelings_thermometer", "calm_toolbox"];
  const assembled: AssembledStory = { title: substitute(tpl.title, ctx), keeper: "blaze", pages: assemblePages(tpl, ctx, workshop), workshop };
  const now = "2026-10-01T00:00:00.000Z";
  return {
    id: "showcase",
    status: "ready",
    progress: "done",
    input: {
      childName: ctx.childName,
      age: 6,
      gender: "boy",
      appearance: { skinTone: "medium", hairStyle: "short", hairColor: "dark_brown" },
      interests: [lang === "ar" ? "كورة" : "football"],
      sidekick: { name: ctx.sidekick!, relation: "sibling" },
      struggle: "anger",
      challengeType: "maze",
      vibe: "funny",
      personalDetail: "",
      parentName: "",
      parentEmail: "",
      language: lang,
      consent: true,
    },
    keeper_id: "blaze",
    generated: { interest_phrases: interest[lang], personal_detail_text: personal[lang], challenge: null, parent_tips: tips[lang], cover_scene: "" },
    assembled,
    cover_url: "/showcase/cover.svg",
    lineart_url: "/showcase/lineart.svg",
    pdf_color_url: null,
    pdf_lineart_url: null,
    error: null,
    email_sent_at: null,
    created_at: now,
    updated_at: now,
  };
}
