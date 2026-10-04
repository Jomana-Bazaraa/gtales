import type { ChallengeType, Lang } from "../types";
import type { KeeperId, StruggleId } from "../keepers";

export type AgeBand = "3-5" | "6-8" | "9-11";
export function ageBand(age: number): AgeBand {
  return age <= 5 ? "3-5" : age <= 8 ? "6-8" : "9-11";
}

export type ActivityId =
  | "breathing_star"
  | "feelings_thermometer"
  | "calm_toolbox"
  | "calm_tracker"
  | "worry_jar"
  | "brave_ladder"
  | "friendship_map"
  | "face_match"
  | "peace_treaty"
  | "sharing_chart"
  | "superpowers_poster"
  | "brave_list"
  | "wordsearch"
  | "feelings_wheel"
  | "say_it_script"
  | "draw_feeling"
  | "memory_box"
  | "then_and_now"
  | "stays_same_list"
  | "safe_people"
  | "strong_words"
  | "truth_pledge"
  | "truth_sort"
  | "maze"
  | "dots"
  | "hidden_objects"
  | "coloring"
  | "choose_path"
  | "riddle"
  | "math";

export interface ActivityMeta {
  id: ActivityId;
  label: Record<Lang, string>;
  blurb: Record<Lang, string>;
  ai?: boolean;
  minBand?: AgeBand; // first band it's suitable for
  maxBand?: AgeBand;
}

export const ACTIVITIES: Record<ActivityId, ActivityMeta> = {
  breathing_star: { id: "breathing_star", label: { en: "Breathing star", ar: "نجمة التنفس" }, blurb: { en: "Trace the star: breathe in on the up-lines, out on the down-lines.", ar: "امشي بصباعك على النجمة: شهيق على الخط الطالع، زفير على النازل." } },
  feelings_thermometer: { id: "feelings_thermometer", label: { en: "Feelings thermometer", ar: "ترمومتر المشاعر" }, blurb: { en: "Colour how big the feeling is — before and after the breath.", ar: "لوّن الإحساس كبير قد إيه — قبل وبعد النفس." } },
  calm_toolbox: { id: "calm_toolbox", label: { en: "My calm-down toolbox", ar: "صندوق الهدوء بتاعي" }, blurb: { en: "Cut out the cards. Pick your 3 favourite calm tools.", ar: "قص الكروت. اختار ٣ أدوات هدوء تحبهم." } },
  calm_tracker: { id: "calm_tracker", label: { en: "7-day blue tracker", ar: "متابعة الأزرق ٧ أيام" }, blurb: { en: "A star for every day you found your blue.", ar: "نجمة لكل يوم لقيت فيه الأزرق بتاعك." }, minBand: "6-8" },
  worry_jar: { id: "worry_jar", label: { en: "Worry jar", ar: "برطمان القلق" }, blurb: { en: "Write or draw a worry, fold it, drop it in the jar.", ar: "اكتب أو ارسم قلقك، اطبقه، وحطه في البرطمان." } },
  brave_ladder: { id: "brave_ladder", label: { en: "Brave steps ladder", ar: "سلم الشجاعة" }, blurb: { en: "Small steps from scary to brave.", ar: "خطوات صغيرة من الخوف للشجاعة." }, minBand: "6-8" },
  friendship_map: { id: "friendship_map", label: { en: "Friendship map", ar: "خريطة الأصحاب" }, blurb: { en: "Draw 3 friends and one kind thing you can do for each.", ar: "ارسم ٣ أصحاب وحاجة لطيفة تعملها لكل واحد." } },
  face_match: { id: "face_match", label: { en: "Match the feeling", ar: "وصّل الإحساس" }, blurb: { en: "Draw a line from each face to its feeling word.", ar: "وصّل كل وش بكلمة الإحساس بتاعه." }, maxBand: "6-8" },
  peace_treaty: { id: "peace_treaty", label: { en: "Peace treaty", ar: "معاهدة السلام" }, blurb: { en: "Three rules both of you agree on. Both sign.", ar: "٣ قواعد تتفقوا عليها انتم الاتنين. وتمضوا." } },
  sharing_chart: { id: "sharing_chart", label: { en: "Sharing chart", ar: "جدول المشاركة" }, blurb: { en: "Whose turn is it? Fill the week.", ar: "دور مين؟ املا الأسبوع." } },
  superpowers_poster: { id: "superpowers_poster", label: { en: "My superpowers", ar: "قواي الخارقة" }, blurb: { en: "Write or draw 3 things you're good at.", ar: "اكتب أو ارسم ٣ حاجات شاطر فيها." } },
  brave_list: { id: "brave_list", label: { en: "Brave things I did", ar: "حاجات شجاعة عملتها" }, blurb: { en: "One brave thing a day, for a week.", ar: "حاجة شجاعة كل يوم، لمدة أسبوع." }, minBand: "6-8" },
  wordsearch: { id: "wordsearch", label: { en: "Word search", ar: "دوّر على الكلمة" }, blurb: { en: "Find the feeling words from the story.", ar: "دوّر على كلمات المشاعر من القصة." }, minBand: "6-8" },
  feelings_wheel: { id: "feelings_wheel", label: { en: "Feelings wheel", ar: "عجلة المشاعر" }, blurb: { en: "Colour each feeling its own colour.", ar: "لوّن كل إحساس بلونه." } },
  say_it_script: { id: "say_it_script", label: { en: "Say it out loud", ar: "قولها بصوت عالي" }, blurb: { en: "\"I feel ___ because ___.\" Fill it in three times.", ar: "\"أنا حاسس بـ ___ عشان ___.\" املاها ٣ مرات." }, minBand: "6-8" },
  draw_feeling: { id: "draw_feeling", label: { en: "Draw your feeling", ar: "ارسم إحساسك" }, blurb: { en: "What does the feeling look like? Draw it in the frame.", ar: "الإحساس شكله إيه؟ ارسمه في البرواز." } },
  memory_box: { id: "memory_box", label: { en: "Memory box", ar: "صندوق الذكريات" }, blurb: { en: "Draw 4 things you want to keep remembering.", ar: "ارسم ٤ حاجات عايز تفضل فاكرها." } },
  then_and_now: { id: "then_and_now", label: { en: "Then and now", ar: "زمان ودلوقتي" }, blurb: { en: "Draw how it was, and how it is now.", ar: "ارسم كان إزاي، وبقى إزاي." } },
  stays_same_list: { id: "stays_same_list", label: { en: "Things that stay the same", ar: "حاجات مبتتغيرش" }, blurb: { en: "List 5 things that haven't changed.", ar: "اكتب ٥ حاجات متغيرتش." }, minBand: "6-8" },
  safe_people: { id: "safe_people", label: { en: "My safe people", ar: "ناسي الأمان" }, blurb: { en: "Draw the people you can always tell.", ar: "ارسم الناس اللي تقدر تقولهم دايماً." } },
  strong_words: { id: "strong_words", label: { en: "Strong words I can say", ar: "كلمات قوية أقدر أقولها" }, blurb: { en: "Cut-out cards: \"Stop.\" \"I don't like that.\" \"I'm telling.\"", ar: "كروت تقصها: \"بس.\" \"مش عاجبني.\" \"هقول.\"" } },
  truth_pledge: { id: "truth_pledge", label: { en: "Truth pledge", ar: "وعد الصدق" }, blurb: { en: "A promise to yourself. Sign it.", ar: "وعد لنفسك. امضيه." } },
  truth_sort: { id: "truth_sort", label: { en: "Truth or story?", ar: "حقيقة ولا حدوتة؟" }, blurb: { en: "Sort the sentences: true, or a tangle?", ar: "فرز الجمل: حقيقة، ولا لخبطة؟" }, minBand: "6-8" },
  maze: { id: "maze", label: { en: "Maze", ar: "متاهة" }, blurb: { en: "Help the Keeper find the way.", ar: "ساعد الحارس يلاقي الطريق." } },
  dots: { id: "dots", label: { en: "Connect the dots", ar: "وصّل النقط" }, blurb: { en: "Reveal the Keeper's symbol.", ar: "اكشف رمز الحارس." } },
  hidden_objects: { id: "hidden_objects", label: { en: "Hidden objects", ar: "الحاجات المستخبية" }, blurb: { en: "Find 5 things hidden in the picture.", ar: "دوّر على ٥ حاجات مستخبية في الصورة." } },
  coloring: { id: "coloring", label: { en: "Colouring page", ar: "صفحة تلوين" }, blurb: { en: "Colour the cover scene.", ar: "لوّن مشهد الغلاف." } },
  choose_path: { id: "choose_path", label: { en: "Choose the path", ar: "اختار الطريق" }, blurb: { en: "What should the Keeper do next?", ar: "الحارس يعمل إيه؟" }, ai: true, minBand: "6-8" },
  riddle: { id: "riddle", label: { en: "Riddle", ar: "لغز" }, blurb: { en: "A riddle only a Helper can solve.", ar: "لغز مفيش غير مساعد يحله." }, ai: true },
  math: { id: "math", label: { en: "Math question", ar: "سؤال حساب" }, blurb: { en: "A number puzzle from the story.", ar: "فزورة أرقام من القصة." }, ai: true },
};

const bandOrder: AgeBand[] = ["3-5", "6-8", "9-11"];
export function suitsBand(a: ActivityMeta, band: AgeBand): boolean {
  const i = bandOrder.indexOf(band);
  if (a.minBand && i < bandOrder.indexOf(a.minBand)) return false;
  if (a.maxBand && i > bandOrder.indexOf(a.maxBand)) return false;
  return true;
}

/** Plot-embedded challenge choices, filtered per struggle. */
export function challengeOptions(struggle: StruggleId, band: AgeBand): ChallengeType[] {
  const base: ChallengeType[] = ["maze", "riddle", "math", "coloring", "dots", "hidden_objects"];
  const social: StruggleId[] = ["friendship", "sibling", "bullied", "lying", "bullying_others", "emotions", "other"];
  if (social.includes(struggle)) base.unshift("choose_path");
  if (band !== "3-5") base.push("wordsearch");
  return base.filter((c) => suitsBand(ACTIVITIES[c as ActivityId], band));
}

/** The Keeper's Workshop: 3 activities by struggle + age. */
export function defaultWorkshop(struggle: StruggleId, keeper: KeeperId | null, band: AgeBand): ActivityId[] {
  const byStruggle: Record<StruggleId, ActivityId[]> = {
    anger: ["breathing_star", "feelings_thermometer", "calm_toolbox", "calm_tracker"],
    violence: ["breathing_star", "calm_toolbox", "feelings_thermometer", "calm_tracker"],
    bullying_others: ["face_match", "friendship_map", "breathing_star", "say_it_script"],
    anxiety: ["worry_jar", "breathing_star", "brave_ladder", "maze"],
    friendship: ["friendship_map", "face_match", "say_it_script", "wordsearch"],
    sibling: ["peace_treaty", "sharing_chart", "feelings_thermometer", "dots"],
    confidence: ["superpowers_poster", "brave_list", "wordsearch", "dots"],
    emotions: ["feelings_wheel", "say_it_script", "draw_feeling", "face_match"],
    loss: ["memory_box", "then_and_now", "stays_same_list", "draw_feeling"],
    bullied: ["safe_people", "strong_words", "superpowers_poster", "breathing_star"],
    lying: ["truth_pledge", "truth_sort", "feelings_thermometer", "maze"],
    other: ["feelings_wheel", "draw_feeling", "breathing_star", "dots"],
  };
  const list = byStruggle[struggle] ?? byStruggle.other;
  const ok = list.filter((a) => suitsBand(ACTIVITIES[a], band));
  // always ensure 3; top up with universal ones
  const universal: ActivityId[] = ["dots", "maze", "draw_feeling", "hidden_objects"];
  for (const u of universal) if (ok.length < 3 && !ok.includes(u)) ok.push(u);
  void keeper;
  return ok.slice(0, 3);
}
