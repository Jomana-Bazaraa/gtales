/**
 * GTales product config: tales, pricing, promises.
 * Source of truth: docs/SPEC.md §1, §1.1, §1.2, §5.
 * Display names change here; template keys (StruggleId) never do.
 */
import type { StruggleId } from "./keepers";

export interface Tale {
  /** Public URL slug, e.g. /tales/anger */
  slug: string;
  /** Template / database key — unchanged */
  key: StruggleId;
  title: string;
  helps: string;
  line: string;
  /** Cover image under /public, or null → "IMAGE NEEDED" placeholder (SPEC §2.5) */
  cover: string | null;
  coverAlt: string;
  /** Portrait (5:7) story covers from the handoff sets, vs the square Series sample */
  portrait?: boolean;
  /** Three sample pages shown on the tale page */
  samples?: { src: string; alt: string }[];
}

export const TALES: Tale[] = [
  {
    slug: "anger",
    key: "anger",
    title: "Calm",
    helps: "Hitting, shouting, slamming doors",
    line: "Your child learns the slow breath that cools the heat.",
    cover: null,
    coverAlt: "Cover of the Calm tale",
  },
  {
    slug: "anxiety",
    key: "anxiety",
    title: "Courage",
    helps: "Worries, nightmares, clinging",
    line: "Your child learns to name the worry so it gets smaller.",
    cover: "/stories/worry/boy/cover.jpg",
    coverAlt: "Cover of the Courage tale: a boy and his robot friend on a rooftop at night, facing the Big Shadow",
    portrait: true,
    samples: [
      { src: "/stories/worry/boy/p01.jpg", alt: "Bedtime: the power goes off and a big shadow appears on the wall" },
      { src: "/stories/worry/girl/p08.jpg", alt: "The hero hides from a barking dog, then the light comes back" },
      { src: "/stories/worry/boy/p13.jpg", alt: "The hero climbs back up and the band shines like a torch" },
    ],
  },
  {
    slug: "bullied",
    key: "bullied",
    title: "Standing tall",
    helps: "Being teased, left out, afraid of school",
    line: "Your child finds a strong voice and a grown-up to tell.",
    cover: "/stories/bullied/girl/cover.jpg",
    coverAlt: "Cover of the Standing tall tale: a girl and her robot friend on the beach, facing the Big Crab",
    portrait: true,
    samples: [
      { src: "/stories/bullied/girl/p01.jpg", alt: "A seagull grabs the hero's snack on the beach" },
      { src: "/stories/bullied/girl/p08.jpg", alt: "The Big Crab snaps and the hero stands tall" },
      { src: "/stories/bullied/girl/p12.jpg", alt: "The hero stands tall, says stop, and tells Mama" },
    ],
  },
  {
    slug: "lying",
    key: "lying",
    title: "Honesty",
    helps: "Small fibs that are getting bigger",
    line: "Your child learns that the truth is lighter to carry.",
    cover: null,
    coverAlt: "Cover of the Honesty tale",
  },
  {
    slug: "feelings",
    key: "emotions",
    title: "Understanding feelings",
    helps: "Meltdowns, tears, not knowing why",
    line: "Your child learns what each feeling is called and where it lives.",
    cover: null,
    coverAlt: "Cover of the Understanding feelings tale",
  },
  {
    slug: "friendship",
    key: "friendship",
    title: "Kindness and friendship",
    helps: "Sharing, taking turns, making friends",
    line: "Your child learns to share the game, not just the ball.",
    cover: null,
    coverAlt: "Cover of the Kindness and friendship tale",
  },
];

export function taleBySlug(slug: string): Tale | undefined {
  return TALES.find((t) => t.slug === slug);
}
export function taleByKey(key: string): Tale | undefined {
  return TALES.find((t) => t.key === key);
}

/* ---------- Pricing (SPEC §1, §11 Settings) ----------
 * Until Admin → Settings exists, values come from env with these defaults.
 * All amounts in EGP, integers. */
export interface Pricing {
  listPrice: number;
  promoCode: string;
  promoPercent: number;
  delivery: number;
}

export function getPricing(): Pricing {
  return {
    listPrice: num(process.env.NEXT_PUBLIC_LIST_PRICE_EGP, 749),
    promoCode: process.env.NEXT_PUBLIC_PROMO_CODE || "LAUNCH40",
    promoPercent: num(process.env.NEXT_PUBLIC_PROMO_PERCENT, 40),
    delivery: num(process.env.NEXT_PUBLIC_DELIVERY_EGP, 89),
  };
}

export function priceBreakdown(p: Pricing = getPricing()) {
  const discount = Math.round((p.listPrice * p.promoPercent) / 100);
  const net = p.listPrice - discount;
  return { ...p, discount, net, total: net + p.delivery };
}

export const egp = (n: number) => `${n.toLocaleString("en-EG")} EGP`;

function num(v: string | undefined, d: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : d;
}

/* ---------- The five promises (SPEC §1.2) ---------- */
export interface Promise_ {
  id: "review" | "cod" | "five" | "crafted" | "play";
  title: string;
  copy: string;
}
export const PROMISES: Promise_[] = [
  {
    id: "review",
    title: "Review and edit",
    copy: "You approve every page. We send the full story to you on WhatsApp. Ask for changes as many times as you like before anything is printed.",
  },
  {
    id: "cod",
    title: "Pay on delivery",
    copy: "Nothing to pay online. Pay the courier when the books are in your hands.",
  },
  {
    id: "five",
    title: "Three books plus a parent guide",
    copy: "Three books, not one. Plus a complete parent guide to help you support your child at home.",
  },
  {
    id: "crafted",
    title: "Truly crafted for your child",
    copy: "Made only for your child. Their face, their name, their people, their struggle, the things they love and the adventure they dream of.",
  },
  {
    id: "play",
    title: "Interactivity",
    copy: "A story they play, not just read. Riddles, mazes, choices and breathing games the hero can't finish without your child.",
  },
];

/* ---------- Site-wide copy (SPEC §2.8, §5) ---------- */
export const COPY = {
  slogan: "Your child is the Hero. Each tale unlocks a Superpower.",
  ctaPrimary: "Create your child's books",
  ctaSecondary: "Try a free story",
  promoBar: (p = getPricing()) =>
    `Launch offer: ${p.promoPercent}% off the printed Series with ${p.promoCode} · Pay on delivery`,
  trustLine: ["Ages 2–10", "You approve every page", "Pay on delivery"],
  reviewsVisible: process.env.NEXT_PUBLIC_REVIEWS_VISIBLE === "true",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || "",
};
