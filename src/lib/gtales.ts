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
    cover: "/stories-web/anger/boy/cover.jpg",
    coverAlt: "Cover of the Calm tale: a boy and his robot friend in Blocktown",
    portrait: true,
    samples: [
      { src: "/stories-web/anger/girl/p01.jpg", alt: "The hero builds the tallest tower, then it starts to wobble" },
      { src: "/stories-web/anger/boy/p08.jpg", alt: "The hero rebuilds the bridge with calm green hands and finds a riddle stone" },
      { src: "/stories-web/anger/girl/p12.jpg", alt: "The hero says sorry to the robot friend and remembers the Power Word" },
    ],
  },
  {
    slug: "anxiety",
    key: "anxiety",
    title: "Courage",
    helps: "Worries, nightmares, clinging",
    line: "Your child learns to name the worry so it gets smaller.",
    cover: "/stories-web/worry/boy/cover.jpg",
    coverAlt: "Cover of the Courage tale: a boy and his robot friend on a rooftop at night, facing the Big Shadow",
    portrait: true,
    samples: [
      { src: "/stories-web/worry/boy/p01.jpg", alt: "Bedtime: the power goes off and a big shadow appears on the wall" },
      { src: "/stories-web/worry/girl/p08.jpg", alt: "The hero hides from a barking dog, then the light comes back" },
      { src: "/stories-web/worry/boy/p13.jpg", alt: "The hero climbs back up and the band shines like a torch" },
    ],
  },
  {
    slug: "bullied",
    key: "bullied",
    title: "Standing tall",
    helps: "Being teased, left out, afraid of school",
    line: "Your child finds a strong voice and a grown-up to tell.",
    cover: "/stories-web/bullied/girl/cover.jpg",
    coverAlt: "Cover of the Standing tall tale: a girl and her robot friend on the beach, facing the Big Crab",
    portrait: true,
    samples: [
      { src: "/stories-web/bullied/boy/p01.jpg", alt: "A sunny day at the club: another child grabs the hero's new ball" },
      { src: "/stories-web/bullied/girl/p08.jpg", alt: "A shell in the sand with a riddle on it" },
      { src: "/stories-web/bullied/boy/p12.jpg", alt: "The hero decides not to hide this time and remembers the Power Word" },
    ],
  },
  {
    slug: "lying",
    key: "lying",
    title: "Honesty",
    helps: "Small fibs that are getting bigger",
    line: "Your child learns that the truth is lighter to carry.",
    cover: "/stories-web/lying/boy/cover.jpg",
    coverAlt: "Cover of the Honesty tale: a boy and his robot friend with the Rainbow Kite",
    portrait: true,
    samples: [
      { src: "/stories-web/lying/girl/p01.jpg", alt: "Friday at Teta's house: a ball bounces and a tea glass breaks" },
      { src: "/stories-web/lying/boy/p08.jpg", alt: "A little card in the nest with a riddle on it" },
      { src: "/stories-web/lying/girl/p12.jpg", alt: "On a dark low cloud, the hero remembers the Power Word" },
    ],
  },
  {
    slug: "feelings",
    key: "emotions",
    title: "Understanding feelings",
    helps: "Meltdowns, tears, not knowing why",
    line: "Your child learns what each feeling is called and where it lives.",
    cover: "/stories-web/feelings/girl/cover.jpg",
    coverAlt: "Cover of the Understanding feelings tale: a girl and her robot friend as the Dust Storm rolls in",
    portrait: true,
    samples: [
      { src: "/stories-web/feelings/girl/p01.jpg", alt: "A birthday party ends and a big, big feeling arrives" },
      { src: "/stories-web/feelings/girl/p08.jpg", alt: "A shiny drop of water with a riddle on it" },
      { src: "/stories-web/feelings/girl/p12.jpg", alt: "The robot friend needs help and the hero remembers the Power Word" },
    ],
  },
  {
    slug: "friendship",
    key: "friendship",
    title: "Kindness and friendship",
    helps: "Sharing, taking turns, making friends",
    line: "Your child learns to share the game, not just the ball.",
    cover: "/stories-web/friendship/girl/cover.jpg",
    coverAlt: "Cover of the Kindness and friendship tale: a girl and her robot friend at the Eid swings",
    portrait: true,
    samples: [
      { src: "/stories-web/friendship/boy/p01.jpg", alt: "Eid: a brand new red car and a friend asking for a turn" },
      { src: "/stories-web/friendship/girl/p08.jpg", alt: "A note inside the big bubble with a riddle on it" },
      { src: "/stories-web/friendship/boy/p12.jpg", alt: "The hero lets go and remembers the Power Word" },
    ],
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
/** Prices that can be zero (a free order, free delivery): "Free" instead of "0 EGP". */
export const egpOrFree = (n: number) => (n === 0 ? "Free" : egp(n));

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
  whatsappText: "Hi GTales! I have a question about a story for my child.",
};
