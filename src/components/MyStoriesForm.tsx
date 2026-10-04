"use client";
import { useState } from "react";
import { useLang } from "@/lib/i18n-client";

export function MyStoriesForm() {
  const { t, lang } = useLang();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/my-stories", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, lang }) });
    setSent(true);
  };
  return (
    <div className="card p-6 sm:p-8">
      <h1 className="text-2xl font-bold mb-1">{t("ms_title")}</h1>
      <p className="text-ink-soft mb-5">{t("ms_sub")}</p>
      {sent ? (
        <p className="rounded-2xl bg-teal-soft p-4 font-semibold">✉️ {t("ms_sent")}</p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input className="field" type="email" required placeholder={t("f10_email")} value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn-primary">{t("ms_send")}</button>
        </form>
      )}
    </div>
  );
}
