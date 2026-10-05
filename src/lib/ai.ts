/**
 * The single Gemini text call per story.
 * Mock mode (no GEMINI_API_KEY) returns deterministic content so the whole app runs locally.
 *
 * Cheapest tiers (verified Oct 2026 on ai.google.dev/gemini-api/docs/pricing):
 *   text:  gemini-3.5-flash-lite   ($0.30 in / $2.50 out per 1M tokens — a story call is ~2k tokens ≈ $0.004)
 *   image: gemini-3.1-flash-lite-image ($0.0336 per 1K image)
 * Override with GEMINI_TEXT_MODEL / GEMINI_IMAGE_MODEL.
 */
import { GoogleGenAI } from "@google/genai";
import { KEEPERS, STRUGGLES, UNIVERSE, type KeeperId } from "./keepers";
import type { AiChallenge, ChallengeType, GeneratedText, StoryInput } from "./types";
import { ageBand } from "./activities/registry";

export const isMockAi = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "mock";
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-3.5-flash-lite";

let _ai: GoogleGenAI | null = null;
export function genai() {
  if (!_ai) _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return _ai;
}

const AI_CHALLENGES: ChallengeType[] = ["riddle", "math", "choose_path"];

interface TextCallArgs {
  input: StoryInput;
  keeper: KeeperId | null;
  slotBefore: string;
  slotAfter: string;
  templateTitle?: string;
}

const challengeSchema = {
  type: "object",
  properties: {
    type: { type: "string" },
    title: { type: "string" },
    prompt: { type: "string" },
    options: { type: "array", items: { type: "string" } },
    answer: { type: "string" },
    hint: { type: "string" },
    outcomes: { type: "array", items: { type: "string" } },
  },
  required: ["type", "title", "prompt", "answer"],
};

const responseSchema = {
  type: "object",
  properties: {
    interest_phrases: {
      type: "object",
      properties: {
        world: { type: "string" },
        place: { type: "string" },
        object: { type: "string" },
        activity: { type: "string" },
      },
      required: ["world", "place", "object", "activity"],
    },
    personal_detail_text: { type: "string" },
    challenge: { ...challengeSchema, nullable: true },
    full_story: {
      type: "object",
      nullable: true,
      properties: {
        title: { type: "string" },
        keeper: { type: "string" },
        pages: { type: "array", items: { type: "string" } },
        moral: { type: "string" },
      },
      required: ["title", "keeper", "pages", "moral"],
    },
    parent_tips: { type: "array", items: { type: "string" } },
    cover_scene: { type: "string" },
  },
  required: ["interest_phrases", "personal_detail_text", "parent_tips", "cover_scene"],
};

export function buildPrompt(a: TextCallArgs): string {
  const { input } = a;
  const lang = input.language;
  const band = ageBand(input.age);
  const keeper = a.keeper ? KEEPERS[a.keeper] : null;
  const struggle = STRUGGLES.find((s) => s.id === input.struggle)!;
  const needsAiChallenge = AI_CHALLENGES.includes(input.challengeType);
  const isOther = input.struggle === "other";
  const interests = input.interests.join(", ");
  const langName = lang === "ar" ? "Egyptian colloquial Arabic (عامية مصرية, NOT Modern Standard Arabic)" : "English";

  const roster = Object.values(KEEPERS)
    .map((k) => `- ${k.id}: ${k.name[lang]} (${k.title[lang]}), ${k.creature[lang]}; flaw: ${k.flaw[lang]}; fixed: ${k.resolution[lang]}`)
    .join("\n");

  return `You write personalized children's stories for Estoria. Output JSON only, matching the schema.
LANGUAGE: all child-facing text in ${langName}. Child age: ${input.age} (band: ${band}). Keep vocabulary and sentence length right for that age.
VIBE: ${input.vibe}${input.favoriteBook ? ` — tone reference: the book "${input.favoriteBook}"` : ""}.

CHILD: name ${input.childName}, ${input.gender === "boy" ? "boy" : "girl"}, into: ${interests}.${input.sidekick ? ` Side character: ${input.sidekick.name} (${input.sidekick.relation}).` : ""}
STRUGGLE: ${struggle.label.en}${isOther ? ` — parent's description: "${input.struggleOther}"` : ""}.
PARENT'S PERSONAL DETAIL to weave in: "${input.personalDetail}"

UNIVERSE: ${UNIVERSE.keepers.en} live in ${UNIVERSE.land.en}; each guards one feeling and has a flaw that IS the feeling. The child is never the one with the problem on the page — the child is the Helper who helps the Keeper, and learns the skill by doing. Never preach. Never name the struggle clinically.
${keeper ? `KEEPER IN THIS STORY: ${keeper.name[lang]} (${keeper.title[lang]}), ${keeper.creature[lang]}. Flaw: ${keeper.flaw[lang]}. Resolved: ${keeper.resolution[lang]}. Personality: ${keeper.personality}` : `KEEPER ROSTER (pick the single best fit for the struggle, return its id in full_story.keeper):\n${roster}`}

TASKS:
1. interest_phrases — four short phrases in ${langName} that drop grammatically into these sentence frames (the template is pre-written):
   world: "the world of ___" style noun phrase (e.g. "the football world")
   place: a concrete location in that world, usable after "at"/"في" (e.g. "the football pitch behind the house")
   object: one beloved object, with article, usable as a direct object (e.g. "his football")
   activity: a present-participle activity, usable after "was"/"كان" (e.g. "practising penalties")
2. personal_detail_text — 1 to 2 sentences, in ${langName}, in the story's narrator voice, that weave the parent's personal detail into the story at this point. It must flow naturally between these two template sentences:
   BEFORE: "${a.slotBefore}"
   AFTER: "${a.slotAfter}"
   Refer to the child by name or pronoun, present tense of the story is past tense. Do not mention the parent. Keep the detail gentle and affectionate — never shaming.
3. challenge — ${needsAiChallenge ? `one "${input.challengeType}" challenge the child solves to help the Keeper at the story's turning point, themed on ${interests} and the Keeper. ${challengeGuide(input.challengeType, band)}` : "null (this story uses a code-generated challenge)."}
4. parent_tips — exactly 4 short conversation questions a parent can ask the child after reading, in ${langName}, tied to this story's events.
5. cover_scene — ONE English sentence describing the cover illustration: the child (do not describe appearance, it's added separately) with the Keeper in the ${interests} setting, Keeper in flawed state. Concrete, visual, no text in the image.
${isOther ? `6. full_story — because the struggle is custom, write the WHOLE story: title, 8–10 pages of 2–4 short paragraphs each, in ${langName}, with the chosen Keeper. The page where the child helps must contain the literal token [INTERACTIVE_SLOT] on its own line. Set the child as helper, the Keeper as the one struggling. End with the child becoming "${UNIVERSE.helper[lang]}" of the Keeper. Include the personal detail naturally (also still fill personal_detail_text with that sentence). moral: one line for parents.` : "6. full_story — null."}`;
}

function challengeGuide(type: ChallengeType, band: string): string {
  switch (type) {
    case "riddle":
      return `A riddle with a one-word answer. ${band === "3-5" ? "Very simple, concrete, about an animal or object." : band === "6-8" ? "Playful, one clue per line, 3 lines." : "Clever, 4 lines, a twist."} Provide hint.`;
    case "math":
      return `A one-step story math problem. ${band === "3-5" ? "Counting up to 5." : band === "6-8" ? "Addition/subtraction within 20." : "Two-step, within 100, or simple multiplication."} answer is the number. Provide hint.`;
    case "choose_path":
      return `A moment where the Keeper must choose what to do. Give 3 options (one clearly best, two tempting but unhelpful). outcomes: for each option, 1–2 sentences of what happens next, in story voice. answer: the index (0-based) of the best option as a string.`;
    default:
      return "";
  }
}

export async function generateStoryText(a: TextCallArgs): Promise<GeneratedText> {
  if (isMockAi) return mockText(a);
  const res = await genai().models.generateContent({
    model: TEXT_MODEL,
    contents: buildPrompt(a),
    config: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.8,
    },
  });
  const text = res.text ?? "";
  const parsed = JSON.parse(text) as GeneratedText;
  if (parsed.challenge && !parsed.challenge.type) parsed.challenge.type = a.input.challengeType;
  return parsed;
}

// ---------------- mock ----------------
function mockText(a: TextCallArgs): GeneratedText {
  const { input } = a;
  const ar = input.language === "ar";
  const i = input.interests[0] || (ar ? "الكورة" : "football");
  const name = input.childName;
  const he = input.gender === "boy";
  const interest_phrases = ar
    ? { world: `عالم ${i}`, place: `ملعب ${i} اللي ورا البيت`, object: `${he ? "كورته" : "كورتها"} المفضلة`, activity: `${he ? "بيتمرن" : "بتتمرن"} على ${i}` }
    : { world: `the world of ${i}`, place: `the ${i} pitch behind the house`, object: `${he ? "his" : "her"} favourite ${i} ball`, activity: `practising ${i}` };

  const personal_detail_text = ar
    ? `ساعات، لما حد يلمس حاجة بتاعة ${name}، ${he ? "بيحس" : "بتحس"} بالسخونة دي برضه — و${he ? "بيقول" : "بتقول"} "مش عدل!" بصوت عالي.`
    : `Sometimes, when someone touched ${name}'s things, ${he ? "he" : "she"} felt the hot thing too — and shouted "That's not fair!" before ${he ? "he" : "she"} could stop it.`;

  let challenge: AiChallenge | null = null;
  if (input.challengeType === "riddle") {
    challenge = ar
      ? { type: "riddle", title: "لغز حامي", prompt: "أنا بسخن لما أزعل، وبهدى لما أتنفس. أنا إيه؟", answer: "النار", hint: "حامي حارس إيه؟" }
      : { type: "riddle", title: "Blaze's riddle", prompt: "I grow hot when I'm upset, and calm when I breathe slow. Red when wild, blue when steady. What am I?", answer: "Fire", hint: "What is Blaze the Keeper of?" };
  } else if (input.challengeType === "math") {
    challenge = ar
      ? { type: "math", title: "حساب البركة", prompt: `عند كل لفة في الطريق للبركة لازم ناخد نفس. الطريق فيه ٤ لفات. و${name} عايز${he ? "" : "ة"} ياخد نفسين في كل لفة. كام نفس؟`, answer: "8", hint: "٤ لفات × ٢ نفس" }
      : { type: "math", title: "Pond maths", prompt: `The path to the Cool Pond has 4 turns. ${name} and Blaze take 2 slow breaths at every turn. How many breaths in total?`, answer: "8", hint: "4 turns × 2 breaths" };
  } else if (input.challengeType === "choose_path") {
    challenge = ar
      ? {
          type: "choose_path",
          title: "حامي يختار",
          prompt: "حامي حس بالسخونة بتيجي تاني. يعمل إيه؟",
          options: ["يحرق النجيلة عشان يرتاح", "يستخبى ويخبي إنه زعلان", "يقف وياخد نفس واحد بالراحة"],
          outcomes: ["النجيلة اتحرقت، وحامي زعل أكتر.", "السخونة فضلت جواه وكبرت.", "الأحمر بدأ يهدى. حامي ابتسم."],
          answer: "2",
        }
      : {
          type: "choose_path",
          title: "Blaze chooses",
          prompt: "Blaze feels the hot thing coming back. What should he do?",
          options: ["Burn the grass to let it out", "Hide and pretend he's fine", "Stop and take one slow breath"],
          outcomes: ["The grass burned, and Blaze felt worse.", "The heat stayed inside and grew.", "The red began to soften. Blaze smiled."],
          answer: "2",
        };
  }

  const parent_tips = ar
    ? [`إيه اللي خلى حامي يبقى أحمر؟`, `${name}، إنت ${he ? "بتحس" : "بتحسي"} بالسخونة دي إمتى؟`, `إيه الحاجة اللي ساعدت حامي يرجع أزرق؟`, `ممكن نجرب نفس البركة الباردة مع بعض؟`]
    : [`What made Blaze turn red?`, `${name}, when do you feel the hot thing?`, `What helped Blaze find his blue?`, `Can we try the Cool Pond breath together right now?`];

  const cover_scene = `${name} in ${i} gear standing on a ${i} field next to Blaze, a small flame creature whose flame has turned red and jagged, scorched grass around them, warm afternoon light`;

  const full_story =
    input.struggle === "other"
      ? {
          title: ar ? `${name} والحارس` : `${name} and the Keeper`,
          keeper: "chroma" as KeeperId,
          pages: ar
            ? [`${name} ${he ? "كان" : "كانت"} في ${interest_phrases.place} لما ${he ? "قابل" : "قابلت"} لوّانة، الحرباية اللي بقت رمادي.`, `"أنا مش عارفة أقول أنا حاسة بإيه،" قالت لوّانة.`, `${personal_detail_text}`, `"يلا نجرب مع بعض،" ${he ? "قال" : "قالت"} ${name}.\n\n[INTERACTIVE_SLOT]`, `لوّانة بدأت تلوّن تاني. "أنا زعلانة،" قالت. وفجأة بقت خضرا وبنفسجي ودهبي.`, `وكده ${name} ${he ? "بقى المساعد الرسمي" : "بقت المساعدة الرسمية"} للوّانة، حارسة الألوان.`]
            : [`${name} was at ${interest_phrases.place} when ${he ? "he" : "she"} met Chroma, the chameleon who had turned completely grey.`, `"I can't say what I'm feeling," said Chroma. "So I went grey."`, personal_detail_text, `"Let's find the word together," said ${name}.\n\n[INTERACTIVE_SLOT]`, `Chroma began to colour again. "I'm sad," she said — and bloomed green and violet and gold.`, `And that is how ${name} became the Official Helper of Chroma, Keeper of Colors.`],
          moral: ar ? "تسمية الإحساس هي أول خطوة للتعامل معاه." : "Naming a feeling is the first step to handling it.",
        }
      : undefined;

  return { interest_phrases, personal_detail_text, challenge, parent_tips, cover_scene, full_story };
}
