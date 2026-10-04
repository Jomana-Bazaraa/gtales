"use client";
import { createContext, useContext } from "react";
import { t as tt, type Key, type Lang } from "./i18n";

const Ctx = createContext<Lang>("en");

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <Ctx.Provider value={lang}>{children}</Ctx.Provider>;
}

export function useLang() {
  const lang = useContext(Ctx);
  return { lang, t: (k: Key) => tt(k, lang), dir: lang === "ar" ? "rtl" : "ltr", isAr: lang === "ar" };
}

export function setLangCookie(lang: Lang) {
  document.cookie = `lang=${lang}; path=/; max-age=31536000; samesite=lax`;
  window.location.reload();
}
