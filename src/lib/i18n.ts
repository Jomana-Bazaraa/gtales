export type Lang = "en" | "ar";

const dict = {
  // nav / global
  brand: { en: "Estoria", ar: "إستوريا" },
  cta_create: { en: "Create Your Child's Story", ar: "اعمل قصة لطفلك" },
  cta_short: { en: "Create a story", ar: "اعمل قصة" },
  my_stories: { en: "My stories", ar: "قصصي" },
  switch_lang: { en: "العربية", ar: "English" },
  free: { en: "Free", ar: "مجاناً" },

  // hero
  hero_eyebrow: { en: "Personalized interactive storybooks", ar: "قصص تفاعلية مخصصة لطفلك" },
  hero_title: {
    en: "Stories where your child doesn't just hear the solution — they live it.",
    ar: "قصص طفلك مش بس بيسمع فيها الحل — بيعيشه.",
  },
  hero_proof: { en: "No photo needed · No card needed · Arabic or English", ar: "من غير صورة · من غير فيزا · عربي أو إنجليزي" },
  see_example: { en: "See a real example", ar: "شوف مثال حقيقي" },

  // how it works
  how_title: { en: "How it works", ar: "بيشتغل إزاي؟" },
  how_1_t: { en: "Tell us about your child", ar: "قولنا عن طفلك" },
  how_1_d: { en: "A short form: name, what they love, and what they're working through. Two minutes, no photo.", ar: "فورم قصير: الاسم، بيحب إيه، وبيواجه إيه. دقيقتين، ومن غير صورة." },
  how_2_t: { en: "Their Keeper comes to life", ar: "الحارس بتاعه بيظهر" },
  how_2_d: { en: "The right Keeper appears in a story set in your child's world — with your child as the one who helps.", ar: "الحارس المناسب بيظهر في قصة في عالم طفلك — وطفلك هو اللي بيساعده." },

  // showcase
  showcase_title: { en: "A real Estoria story", ar: "قصة إستوريا حقيقية" },
  showcase_sub: { en: "Adam, 6, loves football and was struggling with anger. This is his book.", ar: "آدم، ٦ سنين، بيحب الكورة وكان بيعاني من الغضب. دي قصته." },
  showcase_open: { en: "Read Adam's full story", ar: "اقرا قصة آدم كاملة" },

  // keepers
  keepers_title: { en: "Meet the Keepers", ar: "تعرّف على الحُرّاس" },
  keepers_sub: {
    en: "Each Keeper guards one feeling — and each one needs help with it. Your child's story matches the Keeper to what your child actually needs.",
    ar: "كل حارس بيحرس إحساس واحد — وكل واحد محتاج مساعدة فيه. قصة طفلك بتختار الحارس اللي طفلك محتاجه فعلاً.",
  },

  // final cta
  final_title: { en: "Ready to make your child the hero?", ar: "جاهز تخلي طفلك البطل؟" },

  footer_privacy: { en: "Privacy & consent", ar: "الخصوصية والموافقة" },
  footer_tag: { en: "Made with care in Egypt", ar: "اتعمل بحب في مصر" },

  // form
  f_step: { en: "Step", ar: "خطوة" },
  f_of: { en: "of", ar: "من" },
  f_next: { en: "Next", ar: "التالي" },
  f_back: { en: "Back", ar: "رجوع" },
  f_submit: { en: "Create the story", ar: "اعمل القصة" },
  f_creating: { en: "Creating…", ar: "جاري الإنشاء…" },
  f_optional: { en: "optional", ar: "اختياري" },
  f_required: { en: "required", ar: "مطلوب" },

  f1_t: { en: "What's your child's name?", ar: "اسم طفلك إيه؟" },
  f1_d: { en: "Or a nickname — this is the hero's name in the story.", ar: "أو اسم الدلع — ده هيبقى اسم البطل في القصة." },
  f1_ph: { en: "e.g. Adam, Lila, Youssef", ar: "مثلاً: آدم، ليلى، يوسف" },

  f2_t: { en: "Age and pronouns", ar: "السن والنوع" },
  f2_age: { en: "Age", ar: "السن" },
  f2_boy: { en: "He / him", ar: "ولد" },
  f2_girl: { en: "She / her", ar: "بنت" },

  f3_t: { en: "What does your child look like?", ar: "طفلك شكله إيه؟" },
  f3_d: { en: "We draw an original illustrated character — never a photo.", ar: "بنرسم شخصية مرسومة أصلية — مش صورة حقيقية أبداً." },
  f3_skin: { en: "Skin tone", ar: "لون البشرة" },
  f3_hair_style: { en: "Hair", ar: "الشعر" },
  f3_hair_color: { en: "Hair color", ar: "لون الشعر" },
  f3_details: { en: "Anything else? (glasses, freckles, a favourite hat…)", ar: "حاجة تانية؟ (نضارة، نمش، طاقية بيحبها…)" },

  f4_t: { en: "What is your child into?", ar: "طفلك بيحب إيه؟" },
  f4_d: { en: "This becomes the world of the story.", ar: "ده هيبقى عالم القصة." },
  f4_ph: { en: "Or type your own…", ar: "أو اكتب بنفسك…" },

  f5_t: { en: "Add a side character?", ar: "تضيف شخصية جانبية؟" },
  f5_d: { en: "A sibling, friend or pet who appears in the story.", ar: "أخ، صاحب، أو حيوان أليف يظهر في القصة." },
  f5_name: { en: "Name", ar: "الاسم" },
  f5_rel: { en: "Who are they?", ar: "مين؟" },
  rel_sibling: { en: "Sibling", ar: "أخ / أخت" },
  rel_friend: { en: "Friend", ar: "صاحب / صاحبة" },
  rel_pet: { en: "Pet", ar: "حيوان أليف" },
  rel_cousin: { en: "Cousin", ar: "ابن / بنت خال أو عم" },

  f6_t: { en: "What is your child working through right now?", ar: "طفلك بيواجه إيه دلوقتي؟" },
  f6_d: { en: "This chooses which Keeper your child meets.", ar: "ده اللي بيحدد طفلك هيقابل أنهي حارس." },
  f6_other_ph: { en: "Describe it in a few sentences…", ar: "اوصفه في كام جملة…" },
  f6_other_warn: {
    en: "For \"something else\", the whole story is written by AI from your description. Please read it before sharing it with your child.",
    ar: "لو اخترت \"حاجة تانية\"، القصة كلها هتتكتب بالذكاء الاصطناعي من وصفك. من فضلك اقراها قبل ما تشاركها مع طفلك.",
  },

  f7_t: { en: "Pick the challenge inside the story", ar: "اختار التحدي اللي جوه القصة" },
  f7_d: { en: "At the story's turning point, your child solves this to help the Keeper. Plus 3 more activities after the story.", ar: "في لحظة التحول في القصة، طفلك بيحل ده عشان يساعد الحارس. وكمان ٣ أنشطة بعد القصة." },

  f8_t: { en: "Story vibe", ar: "جو القصة" },
  f8_d: { en: "Shapes the tone of the personalized parts and the illustration.", ar: "بيحدد أسلوب الأجزاء المخصصة والرسمة." },
  f8_book: { en: "A favourite book, for tone? (optional)", ar: "كتاب بيحبه، كمرجع للأسلوب؟ (اختياري)" },

  f9_t: { en: "A personal detail to weave in", ar: "تفصيلة شخصية نحطها في القصة" },
  f9_d: { en: "An inside joke, a phrase they always say, a habit, a trigger. This is what makes the story unmistakably theirs.", ar: "نكتة بينكم، جملة بيقولها دايماً، عادة، حاجة بتعصبه. دي اللي بتخلي القصة بتاعته هو." },
  f9_ph: { en: "e.g. He says 'that's not fair!' and stomps when his sister touches his cards", ar: "مثلاً: بيقول 'مش عدل!' وبيخبط برجله لما أخته تلمس كروته" },

  f10_t: { en: "Where should we send the story?", ar: "نبعت القصة فين؟" },
  f10_name: { en: "Your name", ar: "اسمك" },
  f10_email: { en: "Email", ar: "الإيميل" },
  f10_phone: { en: "Phone (optional)", ar: "الموبايل (اختياري)" },

  f11_t: { en: "Story language", ar: "لغة القصة" },
  lang_ar: { en: "Arabic (Egyptian)", ar: "عربي (مصري)" },
  lang_en: { en: "English", ar: "إنجليزي" },

  f12_consent: {
    en: "I consent to Estoria using the information provided to create a personalized story for my child. No photo is collected or used.",
    ar: "أوافق إن إستوريا تستخدم المعلومات دي لعمل قصة مخصصة لطفلي. مفيش أي صورة بتتجمع أو تتستخدم.",
  },
  f12_review: { en: "Quick review", ar: "مراجعة سريعة" },

  // status
  s_writing: { en: "is being written…", ar: "قصته بتتكتب…" },
  s_step_template: { en: "Choosing the right Keeper", ar: "بنختار الحارس المناسب" },
  s_step_text: { en: "Weaving in the personal details", ar: "بنحط التفاصيل الشخصية" },
  s_step_images: { en: "Painting the cover", ar: "بنرسم الغلاف" },
  s_step_pdf: { en: "Finishing your story", ar: "بنخلّص القصة" },
  s_failed: { en: "Something went wrong. Please try again.", ar: "حصلت مشكلة. جرّب تاني." },

  // story page
  st_read: { en: "The story", ar: "القصة" },
  st_workshop: { en: "'s Workshop", ar: " — الورشة" },
  st_badge: { en: "Your badge", ar: "شارتك" },
  st_parents: { en: "For parents", ar: "للأهل" },
  st_share: { en: "Share", ar: "شارك" },
  st_save_link: { en: "Save this link — it's the only way back to the story.", ar: "احفظ اللينك ده — هو الطريقة الوحيدة ترجع للقصة." },
  st_reveal: { en: "Tap to reveal the answer", ar: "دوس عشان تشوف الإجابة" },
  st_ai_notice: {
    en: "This story was written by AI from your description. Please read it before sharing with your child.",
    ar: "القصة دي اتكتبت بالذكاء الاصطناعي من وصفك. من فضلك اقراها قبل ما تشاركها مع طفلك.",
  },

  // physical order
  po_title: { en: "'s story as a real printed book?", ar: " — عايز القصة كتاب مطبوع؟" },
  po_sub: { en: "Delivered to your door. Pay on delivery, no card required.", ar: "لحد باب البيت. الدفع عند الاستلام، من غير فيزا." },
  po_name: { en: "Recipient name", ar: "اسم المستلم" },
  po_address: { en: "Full address", ar: "العنوان بالكامل" },
  po_city: { en: "City", ar: "المدينة" },
  po_gov: { en: "Governorate", ar: "المحافظة" },
  po_phone: { en: "Phone", ar: "الموبايل" },
  po_confirm: { en: "I confirm I want to order a printed copy and will pay on delivery.", ar: "أؤكد إني عايز أطلب نسخة مطبوعة وهدفع عند الاستلام." },
  po_submit: { en: "Order printed book", ar: "اطلب الكتاب المطبوع" },
  po_done: { en: "Order received! We'll call you to confirm delivery.", ar: "استلمنا طلبك! هنكلمك عشان نأكد التوصيل." },
  po_price: { en: "Price", ar: "السعر" },
  po_eta: { en: "Delivery in 5–7 days within Egypt", ar: "التوصيل خلال ٥–٧ أيام داخل مصر" },

  // my stories
  ms_title: { en: "Find your stories", ar: "دوّر على قصصك" },
  ms_sub: { en: "Enter the email you used and we'll send you links to every story.", ar: "اكتب الإيميل اللي استخدمته وهنبعتلك لينكات كل القصص." },
  ms_send: { en: "Send me my stories", ar: "ابعتلي قصصي" },
  ms_sent: { en: "If we have stories for that email, they're on their way.", ar: "لو عندنا قصص للإيميل ده، في الطريق إليك." },
} as const;

export type Key = keyof typeof dict;

export function t(key: Key, lang: Lang): string {
  return dict[key][lang];
}

export const INTEREST_CHIPS = [
  { id: "football", en: "Football", ar: "كورة" },
  { id: "dinosaurs", en: "Dinosaurs", ar: "ديناصورات" },
  { id: "space", en: "Space", ar: "الفضاء" },
  { id: "animals", en: "Animals", ar: "حيوانات" },
  { id: "art", en: "Drawing & art", ar: "رسم وفنون" },
  { id: "gaming", en: "Video games", ar: "ألعاب فيديو" },
  { id: "cars", en: "Cars", ar: "عربيات" },
  { id: "princesses", en: "Princesses", ar: "أميرات" },
  { id: "superheroes", en: "Superheroes", ar: "أبطال خارقين" },
  { id: "sea", en: "The sea", ar: "البحر" },
  { id: "cooking", en: "Cooking", ar: "طبخ" },
  { id: "music", en: "Music", ar: "موسيقى" },
];

export const VIBES = [
  { id: "funny", en: "Funny", ar: "مضحكة" },
  { id: "magical", en: "Magical", ar: "سحرية" },
  { id: "mysterious", en: "Mysterious", ar: "غامضة" },
  { id: "fantasy", en: "Fantasy", ar: "خيالية" },
];

export const SKIN_TONES = [
  { id: "fair", hex: "#f6dcc4", en: "Fair", ar: "فاتح جداً" },
  { id: "light", hex: "#e9bf9a", en: "Light", ar: "فاتح" },
  { id: "medium", hex: "#cf9a6c", en: "Medium", ar: "قمحي" },
  { id: "olive", hex: "#b8824f", en: "Olive", ar: "زيتوني" },
  { id: "brown", hex: "#8d5a33", en: "Brown", ar: "أسمر" },
  { id: "deep", hex: "#5a3a22", en: "Deep", ar: "غامق" },
];

export const HAIR_STYLES = [
  { id: "short", en: "Short", ar: "قصير" },
  { id: "medium", en: "Medium", ar: "متوسط" },
  { id: "long", en: "Long", ar: "طويل" },
  { id: "curly", en: "Curly", ar: "كيرلي" },
  { id: "braids", en: "Braids", ar: "ضفاير" },
  { id: "hijab", en: "Hijab", ar: "حجاب" },
  { id: "buzz", en: "Buzz cut", ar: "حلاقة قصيرة" },
];

export const HAIR_COLORS = [
  { id: "black", hex: "#1f1a17", en: "Black", ar: "أسود" },
  { id: "dark_brown", hex: "#4a2f1d", en: "Dark brown", ar: "بني غامق" },
  { id: "brown", hex: "#7a4f2c", en: "Brown", ar: "بني" },
  { id: "blonde", hex: "#d9b36a", en: "Blonde", ar: "أشقر" },
  { id: "red", hex: "#b4502b", en: "Red", ar: "أحمر" },
];

export const GOVERNORATES = [
  "Cairo", "Giza", "Alexandria", "Qalyubia", "Sharqia", "Dakahlia", "Gharbia", "Monufia", "Beheira", "Kafr El Sheikh",
  "Damietta", "Port Said", "Ismailia", "Suez", "North Sinai", "South Sinai", "Red Sea", "Fayoum", "Beni Suef", "Minya",
  "Asyut", "Sohag", "Qena", "Luxor", "Aswan", "New Valley", "Matrouh",
];
