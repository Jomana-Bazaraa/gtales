import type { KeeperId, StruggleId } from "./keepers";

export type Lang = "en" | "ar";
export type Gender = "boy" | "girl";
export type StoryStatus = "pending" | "generating" | "ready" | "failed";
export type ChallengeType =
  | "maze"
  | "riddle"
  | "math"
  | "wordsearch"
  | "dots"
  | "choose_path"
  | "coloring"
  | "hidden_objects";

export interface Appearance {
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  details?: string;
}

export interface Sidekick {
  name: string;
  relation: "sibling" | "friend" | "pet" | "cousin";
}

/** Everything the parent submits. */
export interface StoryInput {
  childName: string;
  age: number;
  gender: Gender;
  appearance: Appearance;
  interests: string[]; // chip ids or free text
  sidekick?: Sidekick;
  struggle: StruggleId;
  struggleOther?: string;
  challengeType: ChallengeType;
  vibe: "funny" | "magical" | "mysterious" | "fantasy";
  favoriteBook?: string;
  personalDetail: string;
  /** GTales free form (SPEC §7): a place they love, favourite food, home words, the companion's name. */
  place?: string;
  food?: string;
  homeWords?: { parent?: string; child?: string };
  parentName: string;
  /** At least one of email / phone (WhatsApp) is required. */
  parentEmail?: string;
  parentPhone?: string;
  language: Lang;
  consent: boolean;
  // honeypot
  website?: string;
}

/** Output of the single text-model call. */
export interface GeneratedText {
  interest_phrases: {
    world: string; // "the world of football"
    place: string; // "the football pitch behind the house"
    object: string; // "a football"
    activity: string; // "practising penalties"
  };
  personal_detail_text: string;
  challenge: AiChallenge | null;
  workshop_ai?: AiChallenge[]; // optional extra AI activities (choose_path etc.)
  /** Only for struggle=other: a full story in pages. */
  full_story?: {
    title: string;
    keeper: KeeperId;
    pages: string[];
    moral: string;
  };
  parent_tips: string[]; // 4 conversation questions
  cover_scene: string; // one-sentence scene description for the illustrator
  page_scenes?: string[]; // one English scene per story text page, in order
}

export interface AiChallenge {
  type: ChallengeType;
  title: string;
  prompt: string;
  options?: string[];
  answer: string;
  hint?: string;
  outcomes?: string[]; // for choose_path, parallel to options
}

export interface StoryPage {
  kind: "cover" | "text" | "challenge" | "activity" | "badge" | "parents";
  title?: string;
  paragraphs?: string[];
  activity?: string; // activity id
  image?: "cover" | "lineart";
  imageUrl?: string; // per-page illustration (full/mixed illustration modes)
}

export interface AssembledStory {
  title: string;
  keeper: KeeperId;
  pages: StoryPage[];
  workshop: string[]; // activity ids
}

export interface StoryRecord {
  id: string;
  status: StoryStatus;
  progress: "template" | "text" | "images" | "pdf" | "done";
  input: StoryInput;
  keeper_id: KeeperId | null;
  generated: GeneratedText | null;
  assembled: AssembledStory | null;
  cover_url: string | null;
  lineart_url: string | null;
  page_images?: string[] | null; // index = text-page number (0-based)
  pdf_color_url: string | null;
  pdf_lineart_url: string | null;
  error: string | null;
  email_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PhysicalOrder {
  id: string;
  story_id: string;
  recipient_name: string;
  address: string;
  city: string;
  governorate: string;
  phone: string;
  notes?: string;
  status: "pending" | "shipped" | "cancelled";
  shipped_at: string | null;
  created_at: string;
}

/** A GTales free story made by the personalization engine (SPEC §7). */
export interface BookRecord {
  id: string;
  slug: string; // tale key / story file
  title: string;
  gender: "boy" | "girl";
  child_name: string;
  form: import("@/stories/schema").StoryForm;
  story: import("@/stories/schema").FilledStory;
  polished: boolean;
  parent_name: string;
  /** email or WhatsApp number, as given */
  contact: string;
  dedication?: string;
  ref?: string;
  ip?: string;
  parent_id?: string;
  session_id?: string;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

/** Series order (SPEC §9–10). */
export type OrderStatus = "ordered" | "being_made" | "awaiting_approval" | "approved" | "printing" | "shipped" | "delivered_paid" | "cancelled";
export interface OrderPerson { who: string; name: string; description?: string; photo_key?: string }
export interface OrderBook { struggle: string; context?: string /* old orders only (question removed 29 Oct) */; people: OrderPerson[]; setting?: string }
export interface OrderRecord {
  id: string;
  status: OrderStatus;
  edit_requested: boolean;
  child: { name: string; age: number; gender: "boy" | "girl"; description?: string };
  photos: { face?: string };
  strengths?: string[]; // old orders only ("What is your child good at?" removed 29 Oct); never shown
  books: OrderBook[]; // 1–3
  world: { favourites: string[]; notes?: string; snack?: string; silly?: string }; // snack/silly: Story Builder cards
  words: { parent?: string; child?: string; nicknames?: string };
  dedication?: string;
  activities: string[];
  parent: { name: string; whatsapp: string; governorate: string; city: string; street: string; landmark?: string; best_time?: string; gift?: OrderGift; quantity?: number /* only if saved before migration 0007 */ };
  /** Books ordered (1–100). Missing on orders placed before 29 Oct = 3 books: always read it via orderQuantity(). */
  quantity?: number;
  promo_code?: string;
  list_price: number; // per book since 29 Oct (orders before: the price of the three-book Series)
  discount: number;
  delivery: number;
  total: number;
  free_story_id?: string;
  ref?: string;
  parent_id?: string;
  notes?: string;
  courier_confirmation?: string;
  photos_deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

/** "This is a gift" (SPEC §9): stored inside `parent` (jsonb), so no migration. */
export interface OrderGift { recipient: string; message?: string; hide_price: boolean }

/** A parent = one user (LAUNCH-PLAN §1b). id = hash of the normalised email or WhatsApp number. */
export interface ParentRecord {
  id: string;
  email?: string;
  whatsapp?: string;
  name?: string;
  source?: string;
  first_book_id?: string;
  first_order_id?: string;
  created_at: string;
  updated_at: string;
}

/** A queued PDF render, picked up by the GitHub Action (scripts/pdf-worker.mjs). */
export interface PdfJob {
  id: string;
  book_id: string;
  status: "queued" | "running" | "done" | "failed";
  requested_by: "parent" | "admin";
  pdf_url: string | null;
  error: string | null;
  attempts: number;
  created_at: string;
  updated_at: string;
}
