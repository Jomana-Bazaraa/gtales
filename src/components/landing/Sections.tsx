"use client";
import Link from "next/link";
import { useLang } from "@/lib/i18n-client";
import { KEEPER_LIST, STRUGGLES } from "@/lib/keepers";
import { KeeperAvatar } from "../KeeperAvatar";

export function HowItWorks() {
  const { t } = useLang();
  const steps = [
    { n: 1, title: t("how_1_t"), desc: t("how_1_d"), color: "bg-coral", icon: "✍️" },
    { n: 2, title: t("how_2_t"), desc: t("how_2_d"), color: "bg-indigo", icon: "✨" },
    { n: 3, title: t("how_3_t"), desc: t("how_3_d"), color: "bg-teal", icon: "📖" },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:py-20">
      <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10">{t("how_title")}</h2>
      <ol className="grid gap-4 sm:gap-6 md:grid-cols-3">
        {steps.map((s) => (
          <li key={s.n} className="card p-6 relative">
            <div className={`${s.color} text-white w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-lg mb-4 display`}>{s.n}</div>
            <div className="absolute top-5 end-5 text-2xl" aria-hidden>{s.icon}</div>
            <h3 className="text-xl font-bold mb-2">{s.title}</h3>
            <p className="text-ink-soft">{s.desc}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function MeetTheKeepers() {
  const { t, lang } = useLang();
  return (
    <section className="bg-indigo text-white py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-3">{t("keepers_title")}</h2>
        <p className="text-center text-white/75 max-w-2xl mx-auto mb-10">{t("keepers_sub")}</p>
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {KEEPER_LIST.map((k) => {
            const struggles = STRUGGLES.filter((s) => s.keeper === k.id).map((s) => s.label[lang]);
            return (
              <li key={k.id} className="rounded-3xl bg-white/8 border border-white/10 p-4 text-center hover:bg-white/14 transition">
                <div className="mx-auto w-20 h-20 rounded-full bg-white/90 flex items-center justify-center mb-3">
                  <KeeperAvatar id={k.id} size={66} />
                </div>
                <div className="font-bold text-lg display">{k.name[lang]}</div>
                <div className="text-xs text-white/70 mb-2">{k.title[lang]}</div>
                <div className="text-[11px] leading-snug text-white/60">{struggles.join(" · ")}</div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function FinalCta() {
  const { t } = useLang();
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h2 className="text-3xl sm:text-4xl font-bold mb-3">{t("final_title")}</h2>
      <p className="text-ink-soft mb-7">{t("final_sub")}</p>
      <Link href="/create" className="btn-primary text-lg">{t("cta_create")}</Link>
    </section>
  );
}
