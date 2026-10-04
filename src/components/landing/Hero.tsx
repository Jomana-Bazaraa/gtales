"use client";
import Link from "next/link";
import { useLang } from "@/lib/i18n-client";
import { KeeperAvatar } from "../KeeperAvatar";

export function Hero() {
  const { t } = useLang();
  return (
    <section className="relative overflow-hidden">
      <div className="absolute -top-24 -end-24 w-72 h-72 rounded-full bg-coral-soft blur-3xl opacity-70" aria-hidden />
      <div className="absolute top-40 -start-20 w-56 h-56 rounded-full bg-teal-soft blur-3xl opacity-70" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 pt-10 pb-14 sm:pt-16 sm:pb-20 grid gap-10 lg:grid-cols-[1.1fr_1fr] items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-indigo-soft text-indigo text-xs sm:text-sm font-bold px-3 py-1.5 mb-5">
            <span className="w-2 h-2 rounded-full bg-teal" /> {t("hero_eyebrow")}
          </p>
          <h1 className="text-[2rem] leading-[1.1] sm:text-5xl lg:text-[3.4rem] font-bold text-ink mb-5">{t("hero_title")}</h1>
          <p className="text-base sm:text-lg text-ink-soft max-w-xl mb-7">{t("hero_sub")}</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <Link href="/create" className="btn-primary text-lg">{t("cta_create")}</Link>
            <a href="#showcase" className="btn-ghost">{t("see_example")}</a>
          </div>
          <p className="mt-5 text-sm text-ink-soft">{t("hero_proof")}</p>
        </div>
        <div className="relative">
          <div className="card overflow-hidden rotate-[-2deg] shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/showcase/cover.svg" alt="Adam and Blaze on the football pitch" className="w-full h-auto block" />
          </div>
          <div className="absolute -bottom-6 -start-3 sm:-start-8 card px-3 py-2 flex items-center gap-2 rotate-[3deg] float">
            <KeeperAvatar id="wisp" size={44} />
            <KeeperAvatar id="pip" size={44} />
            <KeeperAvatar id="chroma" size={44} />
            <span className="text-xs font-bold text-indigo pe-1">+6</span>
          </div>
        </div>
      </div>
    </section>
  );
}
