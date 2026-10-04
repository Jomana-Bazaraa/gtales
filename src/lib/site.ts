import { headers } from "next/headers";

/** Absolute base URL of this deployment (works on Vercel previews and custom domains). */
export async function baseUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export const PHYSICAL_BOOK_PRICE_EGP = Number(process.env.NEXT_PUBLIC_BOOK_PRICE_EGP || 450);
