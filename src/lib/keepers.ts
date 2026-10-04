/**
 * The Keepers — Estoria's recurring cast. Each guards one feeling.
 * One Keeper per struggle; Blaze covers three template variants.
 */

export type Lang = "en" | "ar";

export type StruggleId =
  | "anger"
  | "violence"
  | "bullying_others"
  | "anxiety"
  | "friendship"
  | "sibling"
  | "confidence"
  | "emotions"
  | "loss"
  | "bullied"
  | "lying"
  | "other";

export type KeeperId =
  | "blaze"
  | "wisp"
  | "pip"
  | "zigzag"
  | "bolt"
  | "chroma"
  | "willow"
  | "pebble"
  | "tangle";

export interface Keeper {
  id: KeeperId;
  name: Record<Lang, string>;
  title: Record<Lang, string>; // "Keeper of Fire"
  creature: Record<Lang, string>;
  flaw: Record<Lang, string>; // what goes wrong — the struggle, in the Keeper's body
  resolution: Record<Lang, string>; // the visual "fixed" state
  color: string; // brand accent for this keeper
  /** Locked visual description sent to the image model. Keep tight to limit drift. */
  visualBrief: string;
  personality: string; // voice notes for the text model
}

export const KEEPERS: Record<KeeperId, Keeper> = {
  blaze: {
    id: "blaze",
    name: { en: "Blaze", ar: "حامي" },
    title: { en: "Keeper of Fire", ar: "حارس النار" },
    creature: { en: "a small flame-creature", ar: "مخلوق صغير من نار" },
    flaw: {
      en: "his flame turns red and jagged and burns the things he loves when he loses control",
      ar: "ناره بتبقى حمرا ومسننة وبتحرق الحاجات اللي بيحبها لما يفقد السيطرة",
    },
    resolution: { en: "his flame settles into a calm, steady blue", ar: "ناره بتهدى وتبقى زرقا وثابتة" },
    color: "#e8673f",
    visualBrief:
      "Blaze: a small, round, friendly flame creature about the size of a cat, made of living fire. Big round eyes, tiny stubby arms, no legs (floats). Calm state: soft blue-and-white flame with rounded tips. Angry state: red-orange flame with jagged, spiky tips and furrowed brows. Always cute, never scary.",
    personality:
      "Impulsive, warm-hearted, quick to feel ashamed after an outburst. Speaks in short bursts. Loves everything intensely.",
  },
  wisp: {
    id: "wisp",
    name: { en: "Wisp", ar: "قلقوشة" },
    title: { en: "Keeper of Clouds", ar: "حارسة السحاب" },
    creature: { en: "a little cloud", ar: "سحابة صغيرة" },
    flaw: {
      en: "she puffs up grey and heavy with every 'what if', until she can barely float",
      ar: "بتنفخ وتبقى رمادي وتقيلة مع كل 'طب لو'، لحد ما تبقى مش قادرة تطير",
    },
    resolution: { en: "she turns light and white and floats again", ar: "بتبقى خفيفة وبيضا وتطير تاني" },
    color: "#7c8bd9",
    visualBrief:
      "Wisp: a small fluffy cloud creature with a round face, rosy cheeks, and tiny mitten-hands. Calm state: bright white, fluffy, floating lightly with a small smile. Worried state: puffed up larger, grey-lilac, droopy, with a few tiny raindrops forming underneath. Always soft and cuddly.",
    personality:
      "Gentle, overthinking, asks lots of 'what if' questions. Very kind. Speaks softly, trails off mid-sentence when worried.",
  },
  pip: {
    id: "pip",
    name: { en: "Pip", ar: "زقزوق" },
    title: { en: "Keeper of Songs", ar: "حارس الأغاني" },
    creature: { en: "a small songbird", ar: "عصفور صغير" },
    flaw: {
      en: "his song only works in harmony — alone it comes out as a squeak",
      ar: "صوته مش بيطلع غنوة غير لما حد يغني معاه — لوحده بيطلع صرير",
    },
    resolution: { en: "his song fills the whole forest when he sings with a friend", ar: "غنوته بتملا الغابة كلها لما يغني مع صاحب" },
    color: "#f2b134",
    visualBrief:
      "Pip: a small round yellow songbird with a tiny orange beak, big expressive eyes, and a single curled feather on top of his head. Wears a tiny striped scarf. Musical notes float around him when he sings. Shy posture when alone (wings tucked), open wings when with friends.",
    personality:
      "Shy, eager, a little clumsy socially. Wants friends badly but freezes. Speaks in hopeful short questions.",
  },
  zigzag: {
    id: "zigzag",
    name: { en: "Zigzag", ar: "لفلوف" },
    title: { en: "Keeper of Paths", ar: "حارس الطرق" },
    creature: { en: "a fox with two tails", ar: "تعلب بديلين" },
    flaw: {
      en: "his two tails argue and knot together, and he can't run until they agree",
      ar: "ديلاته الاتنين بيتخانقوا ويتلخبطوا في بعض، ومش بيقدر يجري غير لما يتفقوا",
    },
    resolution: { en: "the tails untangle and swish together in rhythm", ar: "الديلين بيتفكوا ويتحركوا مع بعض بإيقاع واحد" },
    color: "#e0862f",
    visualBrief:
      "Zigzag: a small orange fox with two big fluffy tails, each with a differently colored tip (one teal, one coral). Pointy ears, bright eyes, white chest. Conflict state: tails knotted together in a tangle, fox looking exasperated. Resolved state: tails swishing in parallel, fox mid-leap.",
    personality:
      "Playful, competitive, fair-minded underneath. Argues with himself out loud (one tail vs the other).",
  },
  bolt: {
    id: "bolt",
    name: { en: "Bolt", ar: "برقوق" },
    title: { en: "Keeper of Light", ar: "حارس النور" },
    creature: { en: "a lightning-bug", ar: "حباحب (دودة مضيئة)" },
    flaw: {
      en: "he dims whenever anyone looks at him, even though his light is the brightest in the forest",
      ar: "نوره بيطفي أول ما حد يبص له، مع إن نوره أقوى نور في الغابة",
    },
    resolution: { en: "he glows bright gold in front of everyone", ar: "بينوّر دهبي قدام الكل" },
    color: "#f5c242",
    visualBrief:
      "Bolt: a tiny round firefly with a soft golden glowing abdomen, translucent wings, big nervous eyes, and little antennae. Shy state: glow dimmed to a faint flicker, hiding behind a leaf. Confident state: glowing bright warm gold, chest out, wings spread.",
    personality:
      "Modest to a fault, self-doubting, secretly brilliant. Mumbles. Lights up (literally) when encouraged.",
  },
  chroma: {
    id: "chroma",
    name: { en: "Chroma", ar: "لوّانة" },
    title: { en: "Keeper of Colors", ar: "حارسة الألوان" },
    creature: { en: "a chameleon", ar: "حرباية" },
    flaw: {
      en: "she turns grey when she hides a feeling, and her colors only come back when she names it",
      ar: "بتبقى رمادي لما تخبي إحساس، وألوانها مش بترجع غير لما تقول هي حاسة بإيه",
    },
    resolution: { en: "she blooms into every color at once", ar: "بتنوّر بكل الألوان مرة واحدة" },
    color: "#2bb3a3",
    visualBrief:
      "Chroma: a small round-bodied chameleon with a curly tail, big gentle eyes, and a tiny crown of leaves. Hiding state: entirely grey, flat colors, closed-off posture. Expressive state: rainbow gradient scales (teal, coral, yellow, violet), bright and open.",
    personality:
      "Thoughtful, reserved, feels a lot but says little. Learns to say 'I feel ___'. Speaks carefully.",
  },
  willow: {
    id: "willow",
    name: { en: "Willow", ar: "ورّاقة" },
    title: { en: "Keeper of Seasons", ar: "حارسة الفصول" },
    creature: { en: "an old tree-spirit", ar: "روح شجرة عجوزة" },
    flaw: {
      en: "she is scared of losing her leaves every autumn, until she sees what grows back",
      ar: "بتخاف تفقد ورقها كل خريف، لحد ما تشوف إيه اللي بيطلع تاني",
    },
    resolution: { en: "new buds open on her branches", ar: "براعم جديدة بتفتح على فروعها" },
    color: "#7fae5b",
    visualBrief:
      "Willow: a kind, grandmotherly tree-spirit — a small walking willow tree with a gentle wooden face in the trunk, long drooping leaf-branches like hair, and roots as feet. Worried state: leaves falling, branches drooping. Hopeful state: tiny pink buds and new green leaves appearing.",
    personality:
      "Wise but tender, remembers everything, afraid of goodbyes. Speaks slowly and warmly, like a grandmother.",
  },
  pebble: {
    id: "pebble",
    name: { en: "Pebble", ar: "سلحوفة" },
    title: { en: "Keeper of Shells", ar: "حارس القواقع" },
    creature: { en: "a small turtle", ar: "سلحفاة صغيرة" },
    flaw: {
      en: "he hides so deep in his shell that he forgot how strong his shell makes him",
      ar: "بيستخبى جوه قوقعته لدرجة إنه نسي إن قوقعته هي اللي بتخليه قوي",
    },
    resolution: { en: "he stands tall on all four feet with his head held high", ar: "بيقف على رجليه الأربعة ورافع راسه" },
    color: "#5b9bb5",
    visualBrief:
      "Pebble: a small round turtle with a smooth teal-blue shell patterned with gentle hexagons, big soft eyes, and a small determined mouth. Hiding state: head and legs pulled inside the shell, only eyes peeking out. Strong state: standing tall, head up, shell gleaming like armor.",
    personality:
      "Quiet, sensitive, braver than he knows. Speaks in a small voice that grows steadier through the story.",
  },
  tangle: {
    id: "tangle",
    name: { en: "Tangle", ar: "لخبوطة" },
    title: { en: "Keeper of Threads", ar: "حارسة الخيوط" },
    creature: { en: "a spider", ar: "عنكبوتة" },
    flaw: {
      en: "her web gets more knotted with every small untruth — only the truth lets her weave a straight line",
      ar: "شبكتها بتتلخبط أكتر مع كل كدبة صغيرة — الصدق بس هو اللي بيخليها تنسج خيط مستقيم",
    },
    resolution: { en: "she weaves a perfect, shining web", ar: "بتنسج شبكة مظبوطة ولامعة" },
    color: "#9b6bd6",
    visualBrief:
      "Tangle: a tiny, cute, fuzzy purple spider with eight short legs, big friendly eyes (only two), and a small bow on her head. Tangled state: surrounded by a messy knotted web, looking flustered. Honest state: sitting in the center of a perfect symmetric sparkling web.",
    personality:
      "Clever, charming, tells little stories to get out of trouble, hates being caught. Learns truth is lighter.",
  },
};

export interface Struggle {
  id: StruggleId;
  keeper: KeeperId | null; // null = "other" → fully generated
  template: string | null; // template variant key
  label: Record<Lang, string>;
}

export const STRUGGLES: Struggle[] = [
  { id: "anger", keeper: "blaze", template: "blaze-anger", label: { en: "Anger & frustration", ar: "الغضب والعصبية" } },
  { id: "violence", keeper: "blaze", template: "blaze-violence", label: { en: "Hitting or violent behaviour", ar: "الضرب أو العنف" } },
  { id: "bullying_others", keeper: "blaze", template: "blaze-bullying", label: { en: "Being unkind or bullying others", ar: "بيتنمر على غيره" } },
  { id: "anxiety", keeper: "wisp", template: "wisp-anxiety", label: { en: "Anxiety & worry", ar: "القلق والخوف" } },
  { id: "friendship", keeper: "pip", template: "pip-friendship", label: { en: "Making or keeping friends", ar: "تكوين صداقات" } },
  { id: "sibling", keeper: "zigzag", template: "zigzag-sibling", label: { en: "Sibling conflict", ar: "الخناق مع الإخوات" } },
  { id: "confidence", keeper: "bolt", template: "bolt-confidence", label: { en: "Confidence at school", ar: "الثقة بالنفس في المدرسة" } },
  { id: "emotions", keeper: "chroma", template: "chroma-emotions", label: { en: "Expressing emotions", ar: "التعبير عن المشاعر" } },
  { id: "loss", keeper: "willow", template: "willow-loss", label: { en: "Dealing with loss or change", ar: "التعامل مع الفقد أو التغيير" } },
  { id: "bullied", keeper: "pebble", template: "pebble-bullied", label: { en: "Being bullied", ar: "بيتعرض للتنمر" } },
  { id: "lying", keeper: "tangle", template: "tangle-lying", label: { en: "Lying", ar: "الكدب" } },
  { id: "other", keeper: null, template: null, label: { en: "Something else…", ar: "حاجة تانية…" } },
];

export const KEEPER_LIST = Object.values(KEEPERS);

export function struggleById(id: string): Struggle | undefined {
  return STRUGGLES.find((s) => s.id === id);
}

export const UNIVERSE = {
  keepers: { en: "the Keepers", ar: "الحُرّاس" },
  land: { en: "Keepersland", ar: "بلد الحُرّاس" },
  helper: { en: "Official Helper", ar: "المساعد الرسمي" },
};
