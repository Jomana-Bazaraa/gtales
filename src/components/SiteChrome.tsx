import Link from "next/link";
import { COPY } from "@/lib/gtales";
import { getSettings } from "@/lib/settings";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`display inline-flex items-center text-[22px] leading-none font-bold text-ink ${className}`} aria-label="GTales home">
      <span className="text-flame">G</span>Tales
    </Link>
  );
}

const NAV = [
  ["#how", "How it works"],
  ["#book", "Meet the book"],
  ["#powers", "Superpowers"],
  ["#pricing", "Pricing"],
  ["#faq", "FAQ"],
];

export async function PromoBar() {
  const s = await getSettings();
  if (!s.promo_bar) return null;
  return (
    <div className="bg-flame text-white text-center text-[13px] md:text-sm font-bold leading-5 px-4 py-2">
      {s.promo_bar}
    </div>
  );
}

export function Header({ landing = false }: { landing?: boolean }) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-line">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-4">
        <Logo />
        {landing && (
          <nav className="hidden lg:flex items-center gap-5 ml-4 text-[15px] font-bold">
            {NAV.map(([href, label]) => (
              <a key={href} href={href} className="text-ink hover:text-sky">{label}</a>
            ))}
          </nav>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Link href="/my-stories" className="hidden md:inline text-sm font-bold text-ink-soft hover:text-sky px-2">My stories</Link>
          <span className="hidden sm:inline"><Link href="/tales" className="btn-ghost !h-10 !px-4 text-sm">{COPY.ctaSecondary}</Link></span>
          <Link href="/order" className="btn-primary !h-10 !px-4 text-sm">{COPY.ctaPrimary}</Link>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const wa = COPY.whatsapp ? `https://wa.me/${COPY.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(COPY.whatsappText)}` : "/my-stories";
  return (
    <footer className="mt-12 border-t border-line bg-surface-tint">
      <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-ink-soft font-medium">
        <Logo className="!text-xl" />
        <div className="flex gap-5">
          <Link href="/privacy" className="hover:text-sky">Privacy</Link>
          <a href={wa} className="hover:text-sky">WhatsApp</a>
          <a href="https://instagram.com/gtales.kids" className="hover:text-sky">Instagram</a>
          <Link href="/my-stories" className="hover:text-sky">My stories</Link>
        </div>
        <span>© {new Date().getFullYear()} GTales · gtales.kids</span>
      </div>
    </footer>
  );
}
