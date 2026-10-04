"use client";
import { useState } from "react";
import { GOVERNORATES, t as tt, type Lang } from "@/lib/i18n";

export function PhysicalOrderForm({ storyId, childName, lang, price }: { storyId: string; childName: string; lang: Lang; price: number }) {
  const t = (k: Parameters<typeof tt>[0]) => tt(k, lang);
  const [f, setF] = useState({ recipientName: "", address: "", city: "", governorate: "Cairo", phone: "", notes: "", confirm: false });
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const upd = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    const r = await fetch("/api/physical-orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ storyId, ...f }) });
    setState(r.ok ? "done" : "error");
  };

  return (
    <section id="order" className="no-print mt-10 card p-6 sm:p-8 border-2 border-coral/40 bg-gradient-to-br from-coral-soft/60 to-white">
      <h2 className="text-2xl font-bold text-ink mb-1">
        {lang === "ar" ? `قصة ${childName}${t("po_title")}` : `Want ${childName}${t("po_title")}`}
      </h2>
      <p className="text-ink-soft mb-1">{t("po_sub")}</p>
      <p className="text-sm font-bold text-coral-dark mb-5">{t("po_price")}: {price} EGP · {t("po_eta")}</p>
      {state === "done" ? (
        <p className="rounded-2xl bg-teal-soft text-teal-900 p-4 font-semibold">✅ {t("po_done")}</p>
      ) : (
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <input className="field" placeholder={t("po_name")} required value={f.recipientName} onChange={(e) => upd("recipientName", e.target.value)} />
          <input className="field" placeholder={t("po_phone")} type="tel" inputMode="tel" required value={f.phone} onChange={(e) => upd("phone", e.target.value)} />
          <input className="field sm:col-span-2" placeholder={t("po_address")} required value={f.address} onChange={(e) => upd("address", e.target.value)} />
          <input className="field" placeholder={t("po_city")} required value={f.city} onChange={(e) => upd("city", e.target.value)} />
          <select className="field" value={f.governorate} onChange={(e) => upd("governorate", e.target.value)}>
            {GOVERNORATES.map((g) => <option key={g}>{g}</option>)}
          </select>
          <label className="sm:col-span-2 flex gap-3 items-start text-sm">
            <input type="checkbox" required checked={f.confirm} onChange={(e) => upd("confirm", e.target.checked)} className="mt-1 w-5 h-5 accent-coral" />
            <span>{t("po_confirm")}</span>
          </label>
          {state === "error" && <p className="sm:col-span-2 text-sm text-coral-dark">{t("s_failed")}</p>}
          <button className="btn-primary sm:col-span-2" disabled={state === "sending"}>{t("po_submit")}</button>
        </form>
      )}
    </section>
  );
}
