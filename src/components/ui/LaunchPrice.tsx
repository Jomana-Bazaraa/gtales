import { egp, priceBreakdown, type Pricing } from "@/lib/gtales";

/** "Launch price ~~249 EGP~~ 149 EGP per book" (fixnow A2): homepage, order page, order summary. Values from getPricing(). */
export function LaunchPrice({ pricing, size = "md", className = "" }: { pricing: Pricing; size?: "sm" | "md" | "lg"; className?: string }) {
  const p = priceBreakdown(pricing);
  const big = size === "lg" ? "text-[32px] md:text-[40px]" : size === "md" ? "text-[28px] md:text-[32px]" : "text-[22px]";
  return (
    <div className={`flex items-center gap-x-3 gap-y-1 flex-wrap ${className}`}>
      <span className="pill bg-sun text-ink">Launch price</span>
      <span className={`text-ink-soft line-through ${size === "sm" ? "text-base" : "text-lg md:text-xl"}`}>{egp(p.listPrice)}</span>
      <span className={`display ${big} font-bold leading-none`}>{egp(p.net)}</span>
      <span className="text-sm font-bold text-ink-soft">per book</span>
    </div>
  );
}
