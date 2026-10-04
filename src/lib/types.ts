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
  parentName: string;
  parentEmail: string;
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
