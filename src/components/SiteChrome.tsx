"use client";
import Link from "next/link";
import { setLangCookie, useLang } from "@/lib/i18n-client";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`display inline-flex items-center gap-2 text-2xl font-bold text-coral ${className}`}>
      <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden>
        <rect x="3" y="4" width="24" height="22" rx="6" fill="#e8673f" />
        <path d="M9 10h12M9 15h12M9 20h7" stroke="#fff8ef" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      Estoria
    </Link>
  );
}

export function Header() {
  const { t, lang } = useLang();
  return (
    <header className="sticky top-0 z-30 bg-cream/85 backdrop-blur border-b border-line">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-3">
        <Logo />
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link href="/my-stories" className="hidden sm:inline text-sm font-semibold text-ink-soft hover:text-indigo px-2">
            {t("my_stories")}
          </Link>
          <button onClick={() => setLangCookie(lang === "ar" ? "en" : "ar")} className="text-sm font-bold text-indigo rounded-full border-2 border-line bg-white px-3 py-2 min-h-[40px]">
            {t("switch_lang")}
          </button>
          <Link href="/create" className="btn-primary !py-2 !px-4 !min-h-[40px] text-sm">
            {t("cta_short")}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="mt-16 border-t border-line bg-cream-deep/60">
      <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-ink-soft">
        <Logo className="!text-xl" />
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-indigo">{t("footer_privacy")}</Link>
          <Link href="/my-stories" className="hover:text-indigo">{t("my_stories")}</Link>
        </div>
        <span>{t("footer_tag")} · © {new Date().getFullYear()} Estoria</span>
      </div>
    </footer>
  );
}
